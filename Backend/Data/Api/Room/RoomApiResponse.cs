namespace Douji.Backend.Data.Api.Room;

public class RoomApiResponse
{
	public required int Id { get; set; }
	public required string Name { get; set; }
	public required bool HasPassword { get; set; }
	public required int UserCount { get; set; }

	public static RoomApiResponse FromRoom(Model.Room room)
	{
		return new RoomApiResponse()
		{
			Id = room.IdNotNull,
			Name = room.Name,
			HasPassword = room.HasPassword,
			UserCount = room.UserCount,
		};
	}
}
