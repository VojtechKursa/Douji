using System.Globalization;
using Douji.Backend.Model.RoomStates;

namespace Douji.Backend.SignalR.Data;

public class HubRoomStateDTO
{
	public required RoomStateEnum State { get; init; }
	public required double? VideoTime { get; init; }
	public required string UpdatedAt { get; init; }

	public static HubRoomStateDTO FromRoomState(RoomState room)
	{
		return new HubRoomStateDTO()
		{
			State = room.State,
			VideoTime = room.VideoTime,
			UpdatedAt = room.UpdatedAt.ToString("O", CultureInfo.InvariantCulture),
		};
	}
}
