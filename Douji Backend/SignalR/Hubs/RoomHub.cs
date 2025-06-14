using System.Globalization;
using Douji.Backend.Data;
using Douji.Backend.Data.Database.Interfaces.DAO;
using Douji.Backend.Model;
using Douji.Backend.Model.ClientStates;
using Douji.Backend.Model.RoomStates;
using Douji.Backend.SignalR.Data;
using Douji.Backend.SignalR.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace Douji.Backend.SignalR.Hubs;

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
		var authenticationData = RoomAuthenticationData.FromQuery(Context.GetHttpContext()?.Request.Query);
		if (authenticationData == null)
		{
			await ForcedDisconnect("Invalid authentication header");
			return;
		}

		var auth = authenticationData.Value;

		var room = db.Rooms.Get(auth.roomId);
		if (room == null)
		{
			await ForcedDisconnect("Invalid room");
			return;
		}

		if (room.PasswordHash != null)
		{
			if (auth.password == null || Hash.ToHex(Hash.Digest(auth.password)) != room.PasswordHash)
			{
				await ForcedDisconnect("Invalid password");
				return;
			}
		}

		User user = new(null, room, auth.username, Context.ConnectionId);
		if (!user.IsValid())
		{
			await ForcedDisconnect("Invalid username");
			return;
		}

		if (!db.Users.Create(user))
		{
			await ForcedDisconnect("Invalid or duplicate username");
			return;
		}

		room.Users.Add(user);

		string groupId = room.IdNotNull.ToString();

		await Clients.Caller.Welcome(new InitialRoomData()
		{
			UserStates = [.. room.Users.Select(HubUserStateDTO.FromUser)],
			CurrentlyPlayedURL = room.CurrentlyPlayedUrl
		});

		await Groups.AddToGroupAsync(Context.ConnectionId, groupId);

		await Clients
			.GroupExcept(groupId, [Context.ConnectionId])
			.UserJoined(HubUserDTO.FromUser(user));
	}

	public override async Task OnDisconnectedAsync(Exception? exception)
	{
		var user = GetUser(Context.ConnectionId);
		if (user == null)
			return;

		var room = user.Room;
		room.Users.Remove(user);

		string group = room.IdNotNull.ToString();

		await Groups.RemoveFromGroupAsync(Context.ConnectionId, group);

		db.Users.Delete(room, user.IdNotNull);

		await Clients.Group(group).UserLeft(HubUserDTO.FromUser(user));
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
