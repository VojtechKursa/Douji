using System.Globalization;
using Douji.Backend.Data;
using Douji.Backend.Data.Database.DAO;
using Douji.Backend.Data.Database.DTO;
using Douji.Backend.Data.State;
using Douji.Backend.Model;
using Douji.Backend.SignalR.Data;
using Douji.Backend.SignalR.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Douji.Backend.SignalR.Hubs;

public class RoomHub(DoujiDbContext database) : Hub<IVideoRoomClient>
{
	private readonly DoujiDbContext db = database;

	private const int allowedTimeDeviationMs = 1000;



	public async Task Play(string url)
	{
		var user = await GetUserDTOAsync(Context.ConnectionId);
		if (user == null)
			return;

		var room = user.Room;

		room.CurrentlyPlayedUrl = url;
		await db.SaveChangesAsync();

		string group = room.Id.ToString();
		await Clients.Group(group).PlayVideo(HubUserDTO.FromUser(User.FromDatabaseDTO(user)), url);
	}

	public async Task UpdateState(string updatedAt, ClientStateEnum state, double? videoTime)
	{
		var userDTO = await GetUserDTOAsync(Context.ConnectionId);
		if (userDTO == null) return;

		string group = userDTO.Room.Id.ToString();

		DateTime updateTime = DateTime.Parse(updatedAt, CultureInfo.InvariantCulture);

		var timeDiff = DateTime.UtcNow - updateTime;
		if (Math.Abs(timeDiff.TotalMilliseconds) > allowedTimeDeviationMs)
		{
			updateTime = DateTime.UtcNow;
		}

		userDTO.ClientState = state;
		userDTO.VideoTime = videoTime;
		userDTO.UpdatedAt = updateTime;
		await db.SaveChangesAsync();

		await Clients.Group(group).UpdateClientState(HubUserStateDTO.FromUser(User.FromDatabaseDTO(userDTO)));
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

		var roomDTO = await db.Rooms.FindAsync(auth.roomId);
		if (roomDTO == null)
		{
			await ForcedDisconnect("Invalid room");
			return;
		}

		if (roomDTO.PasswordHash != null)
		{
			if (auth.password == null || Hash.ToHex(Hash.Digest(auth.password)) != roomDTO.PasswordHash)
			{
				await ForcedDisconnect("Invalid password");
				return;
			}
		}

		UserDatabaseDTO user = new()
		{
			ConnectionId = Context.ConnectionId,
			Name = auth.username,
			Room = roomDTO,
			ClientState = ClientStateEnum.Unstarted,
			UpdatedAt = DateTime.UtcNow,
			VideoTime = null,
		};

		try
		{
			await db.Users.AddAsync(user);
			await db.SaveChangesAsync();
		}
		catch
		{
			await ForcedDisconnect("Invalid or duplicate username");
			return;
		}

		await Groups.AddToGroupAsync(Context.ConnectionId, roomDTO.Id.ToString());

		await Clients
			.GroupExcept(roomDTO.Id.ToString(), [Context.ConnectionId])
			.UserJoined(HubUserDTO.FromUser(User.FromDatabaseDTO(user)));

		await Clients.Caller.Welcome(new InitialRoomData()
		{
			UserStates = [.. roomDTO.Users.Select(User.FromDatabaseDTO).Select(HubUserStateDTO.FromUser)],
			CurrentlyPlayedURL = roomDTO.CurrentlyPlayedUrl
		});
	}

	public override async Task OnDisconnectedAsync(Exception? exception)
	{
		var user = await GetUserDTOAsync(Context.ConnectionId);
		if (user == null)
			return;

		var room = user.Room;
		string group = room.Id.ToString();

		await Groups.RemoveFromGroupAsync(Context.ConnectionId, group);

		room.Users.Remove(user);
		db.Users.Remove(user);
		await db.SaveChangesAsync();

		await Clients.Group(group).UserLeft(HubUserDTO.FromUser(User.FromDatabaseDTO(user)));
	}

	private async Task<UserDatabaseDTO?> GetUserDTOAsync(string connectionId) =>
		await db.Users.Where(user => user.ConnectionId == connectionId).FirstOrDefaultAsync();

	private async Task ForcedDisconnect(string? reason)
	{
		if (reason != null)
		{
			await Clients.Caller.ForcedDisconnect(reason);
		}

		Context.Abort();
	}
}
