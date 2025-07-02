using Douji.Backend.Model;

namespace Douji.Backend.Data.Database.Interfaces.DAO;

public interface IRoomMemory
{
	bool Create(Room room);
	bool Delete(int id);

	IEnumerable<Room> List();
	Room? Get(int id);
}
