using System.ComponentModel.DataAnnotations;
using Douji.Backend.Data.State;
using Microsoft.EntityFrameworkCore;

namespace Douji.Backend.Data.Database.DTO;

[Index(nameof(ConnectionId), IsUnique = true)]
[Index(nameof(Room), nameof(Name), IsUnique = true)]
public class UserDatabaseDTO
{
	[Key]
	public int Id { get; init; }

	public virtual required RoomDatabaseDTO Room { get; init; }

	[Length(1, 128)]
	public required string Name { get; set; }

	public required string ConnectionId { get; init; }

	public required ClientStateEnum ClientState { get; set; }

	public required double? VideoTime { get; set; }

	public required DateTime UpdatedAt { get; set; }
}
