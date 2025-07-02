using System.Diagnostics;
using System.Globalization;
using Douji.Backend.Auth;
using Douji.Backend.Data.Database.Interfaces.DAO;
using Douji.Backend.Model;
using Douji.Backend.Model.ClientStates;
using Douji.Backend.Model.RoomStates;
using Douji.Backend.SignalR.Data;
using Douji.Backend.SignalR.Interfaces;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Douji.Backend.SignalR.Hubs;

[
	Authorize
	(
		AuthenticationSchemes = AuthConstants.AuthenticationSchemes.RoomAccessScheme,
		Policy = AuthConstants.AuthorizationPolicies.RoomAccessPolicy
	)
]
public class RoomHub(IDoujiInMemoryDb database) : Hub<IVideoRoomClient>, IRoomHub
{
	private readonly IDoujiInMemoryDb db = database;

	private const int allowedTimeDeviationMs = 1000;



	public async Task Play(string url)
	{
		var user = GetUser(Context.ConnectionId);
		if (user == null)
			return;

		var room = user.Room;
		room.CurrentlyPlayedUrl = url;
		room.RoomState = new RoomStateUnstarted(DateTime.UtcNow);

		string group = room.IdNotNull.ToString();
		await Clients.Group(group).PlayVideo(HubUserDTO.FromUser(user), url);
	}

	public Task<string> GetTime(string requestedAt) =>
		Task.FromResult(DateTime.UtcNow.ToString("O", CultureInfo.InvariantCulture));

	public async Task UpdateState(string updatedAt, ClientStateEnum state, double? videoTime)
	{
		var user = GetUser(Context.ConnectionId);
		if (user == null) return;

		Room room = user.Room;

		string group = room.IdNotNull.ToString();

		DateTime updateTime = DateTime.Parse(updatedAt, CultureInfo.InvariantCulture);

		var timeDiff = DateTime.UtcNow - updateTime;
		if (Math.Abs(timeDiff.TotalMilliseconds) > allowedTimeDeviationMs)
		{
			updateTime = DateTime.UtcNow;
		}

		user.ClientState = new ClientState()
		{
			State = state,
			VideoTime = videoTime,
			UpdatedAt = updateTime
		};

		await Clients.Group(group).UpdateClientState(HubUserStateDTO.FromUser(user));

		ClientState clientState = new() { State = state, UpdatedAt = updateTime, VideoTime = videoTime };

		RoomState? newRoomState = room.RoomState.AcceptClientStateEvent(clientState, user, room);

		if (newRoomState == null)
			return;

		room.RoomState = newRoomState;

		await Clients.Group(group).UpdateRoomState(HubRoomStateDTO.FromRoomState(newRoomState));
	}

	public override async Task OnConnectedAsync()
	{
		HttpContext? httpContext = Context.GetHttpContext() ?? throw new UnreachableException();

		var roomIdQueryStr = httpContext.Request.Query.FirstOrDefault
		(
			parameter => parameter.Key == "roomId"
		).Value.FirstOrDefault();

		if (roomIdQueryStr == null || !int.TryParse(roomIdQueryStr, out int roomId))
		{
			await ForcedDisconnect("Room ID not specified or invalid");
			return;
		}

		var identity = httpContext.User.Identities.FirstOrDefault
		(
			identity => identity.Claims.Any
			(
				claim =>
					claim.Issuer == AuthConstants.ClaimsIssuerLocal &&
					claim.Type == AuthConstants.Claims.AuthorizedRoomIdClaim &&
					claim.Value == roomId.ToString()
			)
		);

		if (identity == null)
		{
			await ForcedDisconnect("Not authorized to access this room.");
			return;
		}

		var username =
			identity.Claims.FirstOrDefault
			(
				claim =>
					claim.Issuer == AuthConstants.ClaimsIssuerLocal && claim.Type == AuthConstants.Claims.UsernameClaim
			)?.Value;

		if (username == null)
		{
			await ForcedDisconnect("Username not specified.");
			return;
		}

		var reservationId =
			identity.Claims.FirstOrDefault
			(
				claim =>
					claim.Issuer == AuthConstants.ClaimsIssuerLocal && claim.Type == AuthConstants.Claims.ReservationIdClaim
			)?.Value;

		if (reservationId == null)
		{
			await ForcedDisconnect("Username reservation not specified");
			return;
		}

		var room = db.Rooms.Get(roomId);
		if (room == null)
		{
			await ForcedDisconnect("Invalid room ID");
			return;
		}

		var reservation = await room.GetReservation(username);

		if (reservation == null || reservation.Id != reservationId)
		{
			await ForcedDisconnect("Invalid username reservation");
			return;
		}

		User user = reservation.ToUser(Context.ConnectionId);

		if (!db.Users.Create(user))
		{
			await ForcedDisconnect("Invalid or duplicit username");
			return;
		}

		if (!await room.AddUser(user, reservation))
		{
			db.Users.Delete(room, user.IdNotNull);
			await ForcedDisconnect("User with identical username is already connected to the room or has that name reserved");
			return;
		}

		if (room.RoomState is RoomStateWaiting rs)
		{
			int id = user.Id ?? throw new UnreachableException();
			rs.AddBufferingUserId(id);
		}

		string groupId = room.IdNotNull.ToString();

		await Clients.Caller.Welcome(new InitialRoomData()
		{
			UserStates = [.. room.Users.Select(HubUserStateDTO.FromUser)],
			RoomState = HubRoomStateDTO.FromRoomState(room.RoomState),
			CurrentlyPlayedURL = room.CurrentlyPlayedUrl
		});

		await Groups.AddToGroupAsync(Context.ConnectionId, groupId);

		await Clients
			.GroupExcept(groupId, [Context.ConnectionId])
			.UserJoined(HubUserDTO.FromUser(user));

		if (reservation != null)
		{
			db.Reservations.Delete(reservation.Id);
		}
	}

	public override async Task OnDisconnectedAsync(Exception? exception)
	{
		var httpContext = Context.GetHttpContext();
		if (httpContext != null)
		{
			try
			{
				await httpContext.SignOutAsync(AuthConstants.AuthenticationSchemes.RoomAccessScheme);
			}
			catch { }
		}

		var user = GetUser(Context.ConnectionId);
		if (user == null)
			return;

		var room = user.Room;
		await room.RemoveUser(user);

		string group = room.IdNotNull.ToString();

		await Groups.RemoveFromGroupAsync(Context.ConnectionId, group);

		int userId = user.IdNotNull;
		db.Users.Delete(room, userId);

		await Clients.Group(group).UserLeft(HubUserDTO.FromUser(user));

		if (room.UserCount <= 0)
		{
			if (room.RoomState is RoomStateWithTime state)
			{
				room.RoomState = new RoomStatePaused(state.GetCurrentExpectedTime(), DateTime.UtcNow);
			}
		}
		else if (room.RoomState is RoomStateWaiting state)
		{
			var newState = state.RemoveBufferingUserId(user.IdNotNull);

			if (newState != null)
			{
				room.RoomState = newState;
				await Clients.Group(group).UpdateRoomState(HubRoomStateDTO.FromRoomState(room.RoomState));
			}
		}
	}

	private User? GetUser(string connectionId) => db.Users.Get(connectionId);

	private async Task ForcedDisconnect(string? reason)
	{
		if (reason != null)
		{
			await Clients.Caller.ForcedDisconnect(reason);
		}

		Context.Abort();
	}
}
