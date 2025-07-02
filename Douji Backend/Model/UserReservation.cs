using System.Security.Cryptography;
using Douji.Backend.Data;

namespace Douji.Backend.Model;

public class UserReservation(string id, Room room, string name, DateTime? creationTime = null) : UserBase(room, name)
{
	public string Id { get; } = id;

	public DateTime CreationTime { get; } = creationTime ?? DateTime.UtcNow;

	public User ToUser(string connectionId) => new(null, Id, Room, Name, connectionId);

	public static string GetRandomId() =>
		Hash.ToHex(Hash.Digest(RandomNumberGenerator.GetBytes(4096)));
}