using Douji.Backend.Model;

namespace Douji.Backend.Data.Database.Interfaces.DAO;

public interface IUserMemory
{
	bool Create(User user);
	bool Delete(Room room, int id);

	IEnumerable<User> List();
	IEnumerable<User>? ListRoomUsers(Room room);
	User? Get(Room room, int id);
	User? Get(Room room, string username);
	User? Get(string connectionId);
}
