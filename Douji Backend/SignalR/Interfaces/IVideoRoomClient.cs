using Douji.Backend.SignalR.Data;

namespace Douji.Backend.SignalR.Interfaces;

public interface IVideoRoomClient
{
	Task Welcome(InitialRoomData initialRoomData);
	Task ForcedDisconnect(string reason);

	Task UserJoined(HubUserDTO user);
	Task UserLeft(HubUserDTO user);

	Task PlayVideo(HubUserDTO user, string url);
	Task UpdateClientState(HubUserStateDTO userState);
}
