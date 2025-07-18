using Douji.Backend.Exceptions;

namespace Douji.Backend.Model.ClientStates;

public class ClientState
{
	public required ClientStateEnum State { get; init; }
	public required double? VideoTime { get; init; }
	public required DateTime UpdatedAt { get; init; }

	public double VideoTimeGuaranteed => VideoTime ?? throw new UnexpectedNullException(nameof(VideoTime), nameof(ClientState));

	public double? GetCurrentExpectedTime()
	{
		if (VideoTime == null)
			return null;

		double videoTime = (double)VideoTime;

		return State switch
		{
			ClientStateEnum.Playing => (DateTime.UtcNow - UpdatedAt).TotalSeconds + videoTime,
			_ => videoTime,
		};
	}
}
