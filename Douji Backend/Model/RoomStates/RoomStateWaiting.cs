using Douji.Backend.Model.ClientStates;

namespace Douji.Backend.Model.RoomStates;

public class RoomStateWaiting(double videoTime, DateTime updatedAt, IEnumerable<User> loadingUsers)
	: RoomStateWithTime(RoomStateEnum.Waiting, videoTime, updatedAt)
{
	protected HashSet<int> BufferingUserIDs { get; } = [.. loadingUsers.Select(user => user.IdNotNull)];

	public override RoomState? AcceptClientStateEvent(ClientState clientState, User user, Room _)
	{
		switch (clientState.State)
		{
			case ClientStateEnum.Ended:
				return new RoomStateEnded(clientState.UpdatedAt);

			case ClientStateEnum.Paused:
				return new RoomStatePaused(clientState.VideoTimeGuaranteed, clientState.UpdatedAt);

			case ClientStateEnum.Buffering:
				AddBufferingUserId(user.IdNotNull);
				break;

			case ClientStateEnum.Waiting:
				return RemoveBufferingUserId(user.IdNotNull);
		}

		return null;
	}

	public void AddBufferingUserId(int id) => BufferingUserIDs.Add(id);

	public RoomState? RemoveBufferingUserId(int id)
	{
		BufferingUserIDs.Remove(id);

		if (BufferingUserIDs.Count <= 0)
		{
			return new RoomStatePlaying(VideoTimeGuaranteed, DateTime.UtcNow);
		}
		else
		{
			return null;
		}

	}

	public override double GetCurrentExpectedTime() => VideoTimeGuaranteed;
}
