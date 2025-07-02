using System.Collections.Immutable;
using Douji.Backend.Data.Database.Interfaces.DAO;
using Douji.Backend.Model;

namespace Douji.Backend.Data.Database.DAO;

public class UserReservationsMemory : IUserReservationsMemory
{
	private readonly Dictionary<string, UserReservation> reservations = [];

	public bool Create(UserReservation reservation)
	{
		try
		{
			reservations.Add(reservation.Id, reservation);
			return true;
		}
		catch
		{
			return false;
		}
	}

	public bool Delete(string id) => reservations.Remove(id);

	public IEnumerable<UserReservation> List() => reservations.Values;

	public UserReservation? Get(string id)
	{
		if (reservations.TryGetValue(id, out UserReservation? reservation))
		{
			return reservation;
		}

		return null;
	}

	public async Task RemoveAllOlderThan(TimeSpan limit)
	{
		var toRemove =
			reservations
				.Where(kvp => kvp.Value.CreationTime + limit >= DateTime.UtcNow)
				.Select(kvp => kvp.Value)
				.ToImmutableArray();

		foreach (var reservation in toRemove)
		{
			await reservation.Room.CancelReservation(reservation);
			reservations.Remove(reservation.Id);
		}
	}
}
