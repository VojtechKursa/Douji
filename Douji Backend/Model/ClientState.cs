using Douji.Backend.Data.State;

namespace Douji.Backend.Model;

public class ClientState
{
	public required ClientStateEnum State { get; init; }
	public required double? VideoTime { get; init; }
	public required DateTime UpdatedAt { get; init; }
}
