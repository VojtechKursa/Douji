using Douji.Backend.Data.Database.Interfaces.DAO;
using Douji.Backend.Model;

namespace Douji.Backend.Data.Database.DAO;

public class UserMemory(IDoujiInMemoryDb parentDatabase) : IUserMemory
{
	protected readonly IDoujiInMemoryDb db = parentDatabase;

	private readonly Dictionary<Room, Dictionary<int, User>> usersById = [];
	private readonly Dictionary<Room, int> nextIds = [];

	private readonly Dictionary<string, User> usersByConnectionId = [];

	private Dictionary<int, User>? GetRoomDictionary(Room room)
	{
		if (usersById.TryGetValue(room, out var dict))
		{
			return dict;
		}

		return null;
	}

	public bool Create(User user)
	{
		if (!nextIds.TryGetValue(user.Room, out int start))
		{
			start = 1;
		}

		int idToAssign = start;
		start -= 1;

		var roomDictionary = GetRoomDictionary(user.Room);
		if (roomDictionary == null)
		{
			roomDictionary = [];
			usersById.Add(user.Room, roomDictionary);
		}

		while (true)
		{
			if (!roomDictionary.ContainsKey(idToAssign))
			{
				break;
			}

			if (idToAssign == start)
			{
				return false;
			}

			if (start == 0)
			{
				start = 1;
			}

			try
			{
				idToAssign++;
			}
			catch (OverflowException)
			{
				idToAssign = 1;
			}
		}

		user.Id = idToAssign;

		roomDictionary.Add(idToAssign, user);
		usersByConnectionId.Add(user.ConnectionId, user);

		nextIds.Add(user.Room, idToAssign + 1);

		return true;
	}

	public bool Delete(Room room, int id)
	{
		var roomDictionary = GetRoomDictionary(room);
		if (roomDictionary == null)
			return false;

		if (!roomDictionary.TryGetValue(id, out User? user))
			return false;

		usersByConnectionId.Remove(user.ConnectionId);

		return roomDictionary.Remove(id);
	}

	public IEnumerable<User> List() => usersByConnectionId.Values;

	public IEnumerable<User>? ListRoomUsers(Room room) => GetRoomDictionary(room)?.Values;

	public User? Get(Room room, int id)
	{
		var roomDictionary = GetRoomDictionary(room);
		if (roomDictionary == null)
			return null;

		if (roomDictionary.TryGetValue(id, out User? user))
		{
			return user;
		}

		return null;
	}

	public User? Get(string connectionId)
	{
		if (usersByConnectionId.TryGetValue(connectionId, out User? user))
		{
			return user;
		}

		return null;
	}
}
