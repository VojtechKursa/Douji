using Douji.Backend.Exceptions;
using Douji.Backend.Model.ClientStates;

namespace Douji.Backend.Model.RoomStates;

public class RoomStatePlaying(double videoTime, DateTime updatedAt)
	: RoomStateWithTime(RoomStateEnum.Playing, videoTime, updatedAt)
{
	public override RoomState? AcceptClientStateEvent(ClientState clientState, User user, Room room)
	{
		return clientState.State switch
		{
			ClientStateEnum.Ended => new RoomStateEnded(clientState.UpdatedAt),
			ClientStateEnum.Paused => new RoomStatePaused(clientState.VideoTimeGuaranteed, clientState.UpdatedAt),
			ClientStateEnum.Playing =>
				Math.Abs(
					GetCurrentExpectedTime() - (clientState.GetCurrentExpectedTime()
					?? throw new UnexpectedNullException(nameof(clientState.VideoTime)))
				) > Constants.PlayingTimeAllowedDeviationSeconds
				? new RoomStatePlaying(clientState.VideoTimeGuaranteed, clientState.UpdatedAt)
				: null,
			ClientStateEnum.Buffering =>
				Math.Abs(
					GetCurrentExpectedTime() - (clientState.GetCurrentExpectedTime()
					?? throw new UnexpectedNullException(nameof(clientState.VideoTime)))
				) > Constants.PlayingTimeAllowedDeviationSeconds
				? new RoomStateWaiting(clientState.VideoTimeGuaranteed, clientState.UpdatedAt, room.Users)
				: new RoomStateWaiting(clientState.VideoTimeGuaranteed, clientState.UpdatedAt, [user]),
			_ => null,
		};
	}

	public override double GetCurrentExpectedTime() => (DateTime.UtcNow - UpdatedAt).TotalMilliseconds + VideoTimeGuaranteed;
}
