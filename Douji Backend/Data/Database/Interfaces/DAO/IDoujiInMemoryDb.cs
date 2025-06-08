namespace Douji.Backend.Data.Database.Interfaces.DAO;

public interface IDoujiInMemoryDb
{
	IRoomMemory Rooms { get; }
	IUserMemory Users { get; }
}
