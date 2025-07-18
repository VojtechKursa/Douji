using Douji.Backend.Data;
using Douji.Backend.Data.Api.Room;
using Douji.Backend.Exceptions;
using Douji.Backend.Model.Interfaces;
using Douji.Backend.Model.RoomStates;

namespace Douji.Backend.Model;

public class Room(int? id, string name, string? passwordHash) : IValidatable
{
	public SemaphoreSlim usersSemaphore = new(1);

	public int? Id { get; set; } = id;

	public string Name { get; set; } = name;

	public string? PasswordHash { get; set; } = passwordHash;

	public string? CurrentlyPlayedUrl { get; set; } = null;

	public RoomState RoomState { get; set; } = new RoomStateUnstarted(DateTime.UtcNow);

	private List<User> UserList { get; } = [];

	private Dictionary<string, UserReservation> Reservations { get; } = [];


	public int UserCount => UserList.Count;
	public bool HasPassword => PasswordHash != null;
	public int IdNotNull => Id ?? throw new UnexpectedNullException(nameof(Id), nameof(Room));

	public IEnumerable<User> Users => UserList.AsEnumerable();



	public bool Update(RoomApiUpdateRequest newRoom)
	{
		if (string.IsNullOrEmpty(newRoom.Name))
		{
			return false;
		}

		Name = newRoom.Name;

		if (newRoom.RemovePassword)
		{
			PasswordHash = null;
		}
		else if (newRoom.NewPassword != null)
		{
			PasswordHash = Hash.ToHex(Hash.Digest(newRoom.NewPassword));
		}

		return true;
	}

	public static Room FromApiRequest(RoomApiCreateRequest request)
	{
		string? passwordHash = request.Password != null ? Hash.ToHex(Hash.Digest(request.Password)) : null;

		return new Room(null, request.Name, passwordHash);
	}

	public bool IsValid() => !string.IsNullOrEmpty(Name);

	public async Task<UserReservation?> ReserveName(string name)
	{
		UserReservation? result;

		await usersSemaphore.WaitAsync();

		if (Reservations.ContainsKey(name) || UserList.Any(user => user.Name == name))
		{
			result = null;
		}
		else
		{
			result = new UserReservation(UserReservation.GetRandomId(), this, name);
			Reservations.Add(result.Name, result);
		}

		usersSemaphore.Release();

		return result;
	}

	public async Task<UserReservation?> GetReservation(string name)
	{
		UserReservation? result;

		await usersSemaphore.WaitAsync();

		if (Reservations.TryGetValue(name, out UserReservation? reservation))
		{
			result = reservation;
		}
		else
		{
			result = null;
		}

		usersSemaphore.Release();

		return result;
	}

	public async Task<UserReservation?> CancelReservation(string name)
	{
		UserReservation? result;

		await usersSemaphore.WaitAsync();

		if (Reservations.TryGetValue(name, out UserReservation? reservation))
		{
			result = reservation;
			Reservations.Remove(name);
		}
		else
		{
			result = null;
		}

		usersSemaphore.Release();

		return result;
	}

	public async Task<bool> CancelReservation(UserReservation reservation) =>
		(await CancelReservation(reservation.Name)) != null;

	public async Task<bool> AddUser(User user, UserReservation? reservation = null)
	{
		bool result;

		await usersSemaphore.WaitAsync();

		if (user.Id == null)
		{
			usersSemaphore.Release();
			throw new BadUsageException(nameof(AddUser));
		}

		if (UserList.Any(val => val.Name == user.Name))
		{
			result = false;
		}
		else
		{
			if (Reservations.TryGetValue(user.Name, out UserReservation? foundReservation))
			{
				if (reservation == null || foundReservation != reservation)
				{
					usersSemaphore.Release();
					throw new BadUsageException(nameof(AddUser));
				}
				else
				{
					result = true;
					Reservations.Remove(foundReservation.Name);
				}
			}
			else
			{
				if (reservation != null)
				{
					usersSemaphore.Release();
					throw new BadUsageException(nameof(AddUser));
				}
				else
				{
					result = true;
				}
			}
		}

		UserList.Add(user);

		usersSemaphore.Release();

		return result;
	}

	public async Task<bool> RemoveUser(User user)
	{
		bool result;

		await usersSemaphore.WaitAsync();

		result = UserList.Remove(user);

		usersSemaphore.Release();

		return result;
	}
}
