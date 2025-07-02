using Douji.Backend.Data.Database.Interfaces.DAO;
using Douji.Backend.Model;

namespace Douji.Backend.Data.Database.DAO;

public class RoomMemory(IDoujiInMemoryDb parentDatabase) : IRoomMemory
{
	protected readonly IDoujiInMemoryDb db = parentDatabase;

	private readonly Dictionary<int, Room> roomsById = [];
	private readonly Dictionary<string, Room> roomsByName = [];
	private int nextId = 1;

	public bool Create(Room room)
	{
		if (roomsByName.ContainsKey(room.Name))
			return false;

		int start = nextId - 1;

		while (true)
		{
			if (!roomsById.TryGetValue(nextId, out _))
			{
				break;
			}

			if (nextId == start)
			{
				return false;
			}

			if (start == 0)
			{
				start = 1;
			}

			try
			{
				nextId++;
			}
			catch (OverflowException)
			{
				nextId = 1;
			}
		}

		room.Id = nextId;
		roomsById[nextId] = room;
		roomsByName[room.Name] = room;

		nextId++;

		return true;
	}

	public bool Delete(int id)
	{
		if (roomsById.TryGetValue(id, out Room? room))
		{
			roomsById.Remove(id);
			roomsByName.Remove(room.Name);

			foreach (User user in room.Users)
			{
				db.Users.Delete(room, user.IdNotNull);
			}

			return true;
		}
		else
		{
			return false;
		}
	}

	public IEnumerable<Room> List() => roomsById.Values;

	public Room? Get(int id)
	{
		if (roomsById.TryGetValue(id, out Room? room))
		{
			return room;
		}
		else
		{
			return null;
		}
	}
}
