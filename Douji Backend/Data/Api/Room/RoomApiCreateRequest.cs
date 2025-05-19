namespace Douji.Backend.Data.Api.Room;

public class RoomApiCreateRequest
{
	public required string Name { get; set; }
	public string? Password { get; set; }
}
