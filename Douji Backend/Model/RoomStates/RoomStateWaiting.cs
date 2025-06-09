using Douji.Backend.Model.ClientStates;

namespace Douji.Backend.Model.RoomStates;

public class RoomStateWaiting(double videoTime, DateTime updatedAt, IEnumerable<User> loadingUsers)
	: RoomStateWithTime(RoomStateEnum.Waiting, videoTime, updatedAt)
{
	public HashSet<int> BufferingUserIDs { get; } = [.. loadingUsers.Select(user => user.IdNotNull)];

	public override RoomState? AcceptClientStateEvent(ClientState clientState, User user, Room _)
	{
		switch (clientState.State)
		{
			case ClientStateEnum.Ended:
				return new RoomStateEnded(clientState.UpdatedAt);

			case ClientStateEnum.Paused:
				return new RoomStatePaused(clientState.VideoTimeGuaranteed, clientState.UpdatedAt);

			case ClientStateEnum.Buffering:
				BufferingUserIDs.Add(user.IdNotNull);
				break;

			case ClientStateEnum.Waiting:
				BufferingUserIDs.Remove(user.IdNotNull);
				if (BufferingUserIDs.Count == 0)
				{
					return new RoomStatePlaying(VideoTimeGuaranteed, DateTime.UtcNow);
				}
				break;
		}

		return null;
	}

	public override double GetCurrentExpectedTime() => VideoTimeGuaranteed;
}
