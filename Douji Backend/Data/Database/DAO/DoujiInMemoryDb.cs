using Douji.Backend.Data.Database.Interfaces.DAO;

namespace Douji.Backend.Data.Database.DAO;

public class DoujiInMemoryDb : IDoujiInMemoryDb
{
	public IRoomMemory Rooms { get; }

	public IUserMemory Users { get; }

	public IUserReservationsMemory Reservations { get; }

	public DoujiInMemoryDb()
	{
		Rooms = new RoomMemory(this);
		Users = new UserMemory(this);
		Reservations = new UserReservationsMemory();
	}
}
