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



	public async Task Play(string url)
	{
		User? user = await GetUserAsync(Context.ConnectionId);
		if (user == null)
			return;

		Room room = user.Room;

		string group = room.Id.ToString();
		await Clients.Group(group).PlayVideo(HubUserDTO.FromUser(user), url);
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
		};

		try
		{
			await db.Users.AddAsync(user);
			await db.SaveChangesAsync();
		}
		catch
		{
			await ForcedDisconnect("Invalid or duplicit username");
			return;
		}

		await Clients.Caller.Welcome(new InitialRoomData()
		{
			Users = [.. room.Users.Select(HubUserDTO.FromUser)],
			CurrentlyPlayedURL = room.CurrentlyPlayedUrl
		});

		await Groups.AddToGroupAsync(Context.ConnectionId, room.Id.ToString());

		await Clients.GroupExcept(room.Id.ToString(), [Context.ConnectionId]).UserJoined(HubUserDTO.FromUser(user));
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
