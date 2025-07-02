using Douji.Backend.Model.ClientStates;

namespace Douji.Backend.Model.RoomStates;

public class RoomStateUnstarted(DateTime updatedAt)
	: RoomState(RoomStateEnum.Unstarted, null, updatedAt)
{
	public override RoomState? AcceptClientStateEvent(ClientState clientState, User user, Room room)
	{
		return clientState.State switch
		{
			ClientStateEnum.Ended => new RoomStateEnded(clientState.UpdatedAt),
			ClientStateEnum.Buffering => new RoomStateWaiting(clientState.VideoTimeGuaranteed, clientState.UpdatedAt, room.Users),
			_ => null,
		};
	}
}
