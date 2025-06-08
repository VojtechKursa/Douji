using Douji.Backend.Data.Database.Interfaces.DAO;
using Douji.Backend.Model;

namespace Douji.Backend.Data.Database.DAO;

public class RoomMemory(IDoujiInMemoryDb parentDatabase) : IRoomMemory
{
	protected readonly IDoujiInMemoryDb db = parentDatabase;

	private readonly Dictionary<int, Room> roomsById = [];
	private int nextId = 1;

	public bool Create(Room room)
	{
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
		roomsById.Add(nextId, room);

		nextId++;

		return true;
	}

	public bool Delete(int id) => roomsById.Remove(id);

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
