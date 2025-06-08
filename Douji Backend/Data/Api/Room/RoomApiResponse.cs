using Douji.Backend.Data.Database.DTO;

namespace Douji.Backend.Data.Api.Room;

public class RoomApiResponse
{
	public required int Id { get; set; }
	public required string Name { get; set; }
	public required bool HasPassword { get; set; }
	public required int UserCount { get; set; }

	public static RoomApiResponse FromRoom(Model.Room room, int userCount)
	{
		return new RoomApiResponse()
		{
			Id = room.Id ?? throw new Exception(),
			Name = room.Name,
			HasPassword = room.HasPassword,
			UserCount = userCount,
		};
	}

	public static RoomApiResponse FromRoomDatabaseDTO(RoomDatabaseDTO room)
	{
		return new RoomApiResponse()
		{
			Id = room.Id,
			Name = room.Name,
			HasPassword = room.PasswordHash != null,
			UserCount = room.Users.Count,
		};
	}
}
