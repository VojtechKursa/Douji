namespace Douji.Backend.SignalR.Data;

public class InitialRoomData
{
	public required HubUserDTO[] Users { get; set; }
	public string? CurrentlyPlayedURL { get; set; }
}
