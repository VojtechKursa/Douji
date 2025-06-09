using Douji.Backend.Model.ClientStates;

namespace Douji.Backend.Model.RoomStates;

public class RoomStatePaused(double videoTime, DateTime updatedAt)
	: RoomStateWithTime(RoomStateEnum.Paused, videoTime, updatedAt)
{
	public override RoomState? AcceptClientStateEvent(ClientState clientState, User user, Room room)
	{
		return clientState.State switch
		{
			ClientStateEnum.Ended => new RoomStateEnded(clientState.UpdatedAt),
			ClientStateEnum.Buffering => new RoomStateWaiting(clientState.VideoTimeGuaranteed, clientState.UpdatedAt, room.Users),
			ClientStateEnum.Playing => new RoomStatePlaying(clientState.VideoTimeGuaranteed, clientState.UpdatedAt),
			ClientStateEnum.Paused =>
				Math.Abs(clientState.VideoTimeGuaranteed - VideoTimeGuaranteed) > Constants.PausedTimeAllowedDeviationSeconds
					? new RoomStatePaused(clientState.VideoTimeGuaranteed, clientState.UpdatedAt)
					: null,
			_ => null,
		};
	}

	public override double GetCurrentExpectedTime() => VideoTimeGuaranteed;
}
