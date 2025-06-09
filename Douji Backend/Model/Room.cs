using Douji.Backend.Data;
using Douji.Backend.Data.Api.Room;
using Douji.Backend.Exceptions;
using Douji.Backend.Model.RoomStates;

namespace Douji.Backend.Model;

public class Room(int? id, string name, string? passwordHash)
{
	public int? Id { get; set; } = id;

	public string Name { get; set; } = name;

	public string? PasswordHash { get; set; } = passwordHash;

	public string? CurrentlyPlayedUrl { get; set; } = null;

	public RoomState RoomState { get; set; } = new RoomStateUnstarted(DateTime.UtcNow);

	public List<User> Users { get; } = [];

	public bool HasPassword => PasswordHash != null;
	public int IdNotNull => Id ?? throw new UnexpectedNullException(nameof(Id), nameof(Room));



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

		return new Room(null, request.Name, passwordHash);
	}
}
