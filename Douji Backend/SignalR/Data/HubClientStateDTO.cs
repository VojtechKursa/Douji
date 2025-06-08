using System.Globalization;
using Douji.Backend.Data.State;
using Douji.Backend.Model;

namespace Douji.Backend.SignalR.Data;

public class HubClientStateDTO
{
	public required ClientStateEnum State { get; init; }
	public required double? VideoTime { get; init; }
	public required string UpdatedAt { get; init; }

	public static HubClientStateDTO FromClientState(ClientState clientState)
	{
		return new HubClientStateDTO()
		{
			State = clientState.State,
			VideoTime = clientState.VideoTime,
			UpdatedAt = clientState.UpdatedAt.ToString("O", CultureInfo.InvariantCulture),
		};
	}
}
