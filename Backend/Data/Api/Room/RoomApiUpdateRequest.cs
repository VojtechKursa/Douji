namespace Douji.Backend.Data.Api.Room;

public class RoomApiUpdateRequest
{
	public required int Id { get; set; }
	public required string Name { get; set; }
	public required bool RemovePassword { get; set; }
	public required string? NewPassword { get; set; }
}
