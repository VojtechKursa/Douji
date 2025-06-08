using Douji.Backend.Data.Database.Interfaces.DAO;
using Douji.Backend.Model;

namespace Douji.Backend.Data.Database.DAO;

public class UserMemory(IDoujiInMemoryDb parentDatabase) : IUserMemory
{
	protected readonly IDoujiInMemoryDb db = parentDatabase;

	public bool Create(User user) => throw new NotImplementedException();
	public bool Delete(User user) => throw new NotImplementedException();
	public User Get(Room room, int id) => throw new NotImplementedException();
	public User Get(Room room, string name) => throw new NotImplementedException();
	public User Get(string connectionId) => throw new NotImplementedException();
	public IEnumerable<User> List() => throw new NotImplementedException();
	public IEnumerable<User> ListRoomUsers(Room room) => throw new NotImplementedException();
}
