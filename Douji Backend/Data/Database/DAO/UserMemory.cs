using Douji.Backend.Data.Database.Interfaces.DAO;
using Douji.Backend.Model;

namespace Douji.Backend.Data.Database.DAO;

public class UserMemory(IDoujiInMemoryDb parentDatabase) : IUserMemory
{
	protected readonly IDoujiInMemoryDb db = parentDatabase;

	private readonly Dictionary<Room, Dictionary<int, User>> usersById = [];
	private readonly Dictionary<Room, Dictionary<string, User>> usersByName = [];
	private readonly Dictionary<Room, int> nextIds = [];

	private readonly Dictionary<string, User> usersByConnectionId = [];

	private Dictionary<int, User>? GetRoomUserIdDictionary(Room room)
	{
		if (usersById.TryGetValue(room, out var dict))
		{
			return dict;
		}

		return null;
	}

	private Dictionary<string, User>? GetRoomUserNameDictionary(Room room)
	{
		if (usersByName.TryGetValue(room, out var dict))
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

		var roomUserIdDictionary = GetRoomUserIdDictionary(user.Room);
		if (roomUserIdDictionary == null)
		{
			roomUserIdDictionary = [];
			usersById[user.Room] = roomUserIdDictionary;
		}

		var roomUserNameDictionary = GetRoomUserNameDictionary(user.Room);
		if (roomUserNameDictionary == null)
		{
			roomUserNameDictionary = [];
			usersByName[user.Room] = roomUserNameDictionary;
		}
		else if (roomUserNameDictionary.ContainsKey(user.Name))
		{
			// If room dictionary contains user with duplicit name
			return false;
		}

		while (true)
		{
			if (!roomUserIdDictionary.ContainsKey(idToAssign))
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

		roomUserIdDictionary[idToAssign] = user;
		roomUserNameDictionary[user.Name] = user;
		usersByConnectionId[user.ConnectionId] = user;

		nextIds[user.Room] = idToAssign + 1;
		return true;
	}

	public bool Delete(Room room, int id)
	{
		var roomUserIdDictionary = GetRoomUserIdDictionary(room);
		if (roomUserIdDictionary == null)
			return false;

		if (!roomUserIdDictionary.TryGetValue(id, out User? user))
			return false;

		roomUserIdDictionary.Remove(id);
		usersByConnectionId.Remove(user.ConnectionId);

		var roomUserNameDictionary = GetRoomUserNameDictionary(room);
		roomUserNameDictionary?.Remove(user.Name);

		return true;
	}

	public IEnumerable<User> List() => usersByConnectionId.Values;

	public IEnumerable<User>? ListRoomUsers(Room room) => GetRoomUserIdDictionary(room)?.Values;

	public User? Get(Room room, int id)
	{
		var roomDictionary = GetRoomUserIdDictionary(room);
		if (roomDictionary == null)
			return null;

		if (roomDictionary.TryGetValue(id, out User? user))
		{
			return user;
		}

		return null;
	}

	public User? Get(Room room, string username)
	{
		var roomDictionary = GetRoomUserNameDictionary(room);
		if (roomDictionary == null)
			return null;

		if (roomDictionary.TryGetValue(username, out User? user))
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
