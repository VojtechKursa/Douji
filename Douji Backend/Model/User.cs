using System.ComponentModel.DataAnnotations;
using System.Globalization;
using Microsoft.EntityFrameworkCore;

namespace Douji.Backend.Model;

[Index(nameof(ConnectionId), IsUnique = true)]
[Index(nameof(Room), nameof(Name), IsUnique = true)]
public class User
{
	[Key]
	public int Id { get; init; }

	public virtual required Room Room { get; init; }

	[Length(1, 128)]
	public required string Name { get; set; }

	public required string ConnectionId { get; init; }

	public required ClientStateEnum ClientState { get; set; }

	public required double? VideoTime { get; set; }

	public required DateTime UpdatedAt { get; set; }

	public ClientState GetClientState() => new()
	{
		State = ClientState,
		VideoTime = VideoTime,
		UpdatedAt = UpdatedAt.ToString("O", CultureInfo.InvariantCulture),
	};
}
