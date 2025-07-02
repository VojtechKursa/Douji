using Douji.Backend.Model;

namespace Douji.Backend.Data.Database.Interfaces.DAO;

public interface IUserReservationsMemory
{
	bool Create(UserReservation reservation);
	bool Delete(string id);

	IEnumerable<UserReservation> List();
	UserReservation? Get(string id);

	Task RemoveAllOlderThan(TimeSpan limit);
}
