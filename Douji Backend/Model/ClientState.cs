namespace Douji.Backend.Model;

public enum ClientStateEnum
{
	Unstarted = 0,
	Playing = 1,
	Paused = 2,
	Buffering = 3,
	Waiting = 4,
	Ended = 5,
}


public class ClientState
{
	public required ClientStateEnum State { get; init; }
	public required double? VideoTime { get; init; }
	public required string UpdatedAt { get; init; }
}
