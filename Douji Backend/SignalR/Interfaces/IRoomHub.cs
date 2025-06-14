using Douji.Backend.Model.ClientStates;
using Douji.Backend.SignalR.Data;

namespace Douji.Backend.SignalR.Interfaces;

/*
 * Interface defining which methods a room hub must implement.
 * Mostly for quick reference of available methods and parameters.
*/
public interface IRoomHub
{
	Task Play(string url);
	Task UpdateState(string updatedAt, ClientStateEnum state, double? videoTime);
	Task<string> GetTime(string requestedAt);
}
