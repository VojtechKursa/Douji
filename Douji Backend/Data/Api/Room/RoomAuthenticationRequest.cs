using Douji.Backend.Model.Interfaces;

namespace Douji.Backend.Data.Api.Room;

public class RoomAuthenticationRequest : IValidatable
{
	public required string Username { get; init; }
	public string? Password { get; init; } = null;

	public bool IsValid() => !string.IsNullOrEmpty(Username);
}
