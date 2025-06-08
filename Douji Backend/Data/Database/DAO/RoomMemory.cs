using Douji.Backend.Data.Database.Interfaces.DAO;
using Douji.Backend.Model;

namespace Douji.Backend.Data.Database.DAO;

public class RoomMemory(IDoujiInMemoryDb parentDatabase) : IRoomMemory
{
	protected readonly IDoujiInMemoryDb db = parentDatabase;

	public bool Create(Room room) => throw new NotImplementedException();
	public bool Delete(Room room) => throw new NotImplementedException();
	public Room Get(int id) => throw new NotImplementedException();
	public IEnumerable<Room> List() => throw new NotImplementedException();
}
