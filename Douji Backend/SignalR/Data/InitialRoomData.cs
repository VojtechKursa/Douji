namespace Douji.Backend.SignalR.Data;

public class InitialRoomData
{
	public required HubUserStateDTO[] UserStates { get; set; }
	public string? CurrentlyPlayedURL { get; set; }
}
