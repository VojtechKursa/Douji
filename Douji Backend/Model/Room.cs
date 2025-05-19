using System.ComponentModel.DataAnnotations;
using Douji.Backend.Data.Api.Room;

namespace Douji.Backend.Model;

public class Room
{
	[Key]
	public int Id { get; set; }

	public required string Name { get; set; }

	[Length(Hash.HashLengthHex, Hash.HashLengthHex)]
	public string? PasswordHash { get; set; } = null;

	[Url]
	public string? CurrentlyPlayedUrl { get; set; } = null;

	public virtual ICollection<User> Users { get; set; } = [];

	public bool HasPassword => PasswordHash != null;



	public void Update(RoomApiUpdateRequest newRoom)
	{
		Name = newRoom.Name;

		if (newRoom.RemovePassword)
		{
			PasswordHash = null;
		}
		else if (newRoom.NewPassword != null)
		{
			PasswordHash = Hash.ToHex(Hash.Digest(newRoom.NewPassword));
		}
	}

	public static Room FromApiRequest(RoomApiCreateRequest request)
	{
		string? passwordHash = request.Password != null ? Hash.ToHex(Hash.Digest(request.Password)) : null;

		return new Room()
		{
			Name = request.Name,
			PasswordHash = passwordHash
		};
	}
}
