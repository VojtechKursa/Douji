using System.ComponentModel.DataAnnotations;
using Douji.Backend.Data.State;

namespace Douji.Backend.Data.Database.DTO;

public class RoomDatabaseDTO
{
	[Key]
	public int Id { get; set; }

	public required string Name { get; set; }

	[Length(Hash.HashLengthHex, Hash.HashLengthHex)]
	public string? PasswordHash { get; set; } = null;

	[Url]
	public string? CurrentlyPlayedUrl { get; set; } = null;

	public RoomStateEnum RoomState { get; set; } = RoomStateEnum.Unstarted;
	public double? VideoTime { get; set; } = null;
	public DateTime RoomStateUpdatedAt { get; set; } = DateTime.UtcNow;

	public virtual ICollection<UserDatabaseDTO> Users { get; set; } = [];
}
