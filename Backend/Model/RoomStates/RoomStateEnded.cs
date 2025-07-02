using Douji.Backend.Model.ClientStates;

namespace Douji.Backend.Model.RoomStates;

public class RoomStateEnded(DateTime updatedAt)
	: RoomState(RoomStateEnum.Ended, null, updatedAt)
{
	public override RoomState? AcceptClientStateEvent(ClientState clientState, User user, Room room)
	{
		return clientState.State switch
		{
			ClientStateEnum.Paused => new RoomStatePaused(clientState.VideoTimeGuaranteed, clientState.UpdatedAt),
			ClientStateEnum.Playing => new RoomStatePlaying(clientState.VideoTimeGuaranteed, clientState.UpdatedAt),
			ClientStateEnum.Buffering => new RoomStateWaiting(clientState.VideoTimeGuaranteed, clientState.UpdatedAt, room.Users),
			_ => null,
		};
	}
}
