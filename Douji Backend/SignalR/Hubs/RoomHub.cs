using System.Globalization;
using Douji.Backend.Data.Database;
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
		User? user = await GetUserAsync(Context.ConnectionId);
		if (user == null)
			return;

		Room room = user.Room;

		room.CurrentlyPlayedUrl = url;
		await db.SaveChangesAsync();

		string group = room.Id.ToString();
		await Clients.Group(group).PlayVideo(HubUserDTO.FromUser(user), url);
	}

	public async Task UpdateState(string updatedAt, ClientStateEnum state, double? videoTime)
	{
		User? user = await GetUserAsync(Context.ConnectionId);
		if (user == null) return;

		string group = user.Room.Id.ToString();

		DateTime updateTime = DateTime.Parse(updatedAt, CultureInfo.InvariantCulture);

		var timeDiff = DateTime.UtcNow - updateTime;
		if (Math.Abs(timeDiff.TotalMilliseconds) > allowedTimeDeviationMs)
		{
			updateTime = DateTime.UtcNow;
		}

		user.ClientState = state;
		user.VideoTime = videoTime;
		user.UpdatedAt = updateTime;
		await db.SaveChangesAsync();

		await Clients.Group(group).UpdateClientState(HubUserStateDTO.FromUser(user));
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

		Room? room = await db.Rooms.FindAsync(auth.roomId);
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

		User user = new()
		{
			ConnectionId = Context.ConnectionId,
			Name = auth.username,
			Room = room,
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

		await Groups.AddToGroupAsync(Context.ConnectionId, room.Id.ToString());

		await Clients
			.GroupExcept(room.Id.ToString(), [Context.ConnectionId])
			.UserJoined(HubUserDTO.FromUser(user));

		await Clients.Caller.Welcome(new InitialRoomData()
		{
			UserStates = [.. room.Users.Select(HubUserStateDTO.FromUser)],
			CurrentlyPlayedURL = room.CurrentlyPlayedUrl
		});
	}

	public override async Task OnDisconnectedAsync(Exception? exception)
	{
		var user = await GetUserAsync(Context.ConnectionId);
		if (user == null)
			return;

		var room = user.Room;
		string group = room.Id.ToString();

		await Groups.RemoveFromGroupAsync(Context.ConnectionId, group);

		room.Users.Remove(user);
		db.Users.Remove(user);
		await db.SaveChangesAsync();

		await Clients.Group(group).UserLeft(HubUserDTO.FromUser(user));
	}

	private async Task<User?> GetUserAsync(string connectionId)
		=> await db.Users.Where(user => user.ConnectionId == connectionId).FirstOrDefaultAsync();

	private async Task ForcedDisconnect(string? reason)
	{
		if (reason != null)
		{
			await Clients.Caller.ForcedDisconnect(reason);
		}

		Context.Abort();
	}
}
