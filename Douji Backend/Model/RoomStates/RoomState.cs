using Douji.Backend.Model.ClientStates;

namespace Douji.Backend.Model.RoomStates;

public enum RoomStateEnum
{
	Unstarted = 0,
	Playing = 1,
	Paused = 2,
	Waiting = 4,
	Ended = 5,
}

public abstract class RoomState(RoomStateEnum state, double? videoTime, DateTime updatedAt)
{
	public RoomStateEnum State { get; } = state;
	public double? VideoTime { get; } = videoTime;
	public DateTime UpdatedAt { get; } = updatedAt;

	public abstract RoomState? AcceptClientStateEvent(ClientState clientState, User user, Room room);
}

public abstract class RoomStateWithTime(RoomStateEnum state, double videoTime, DateTime updatedAt)
	: RoomState(state, videoTime, updatedAt)
{
	public double VideoTimeGuaranteed { get; } = videoTime;

	public abstract double GetCurrentExpectedTime();
}
