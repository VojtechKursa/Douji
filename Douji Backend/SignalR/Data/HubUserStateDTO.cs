using Douji.Backend.Model;

namespace Douji.Backend.SignalR.Data;

public class HubUserStateDTO
{
	public required HubUserDTO User { get; set; }
	public required ClientState State { get; set; }

	public static HubUserStateDTO FromUser(User user) => new()
	{
		User = HubUserDTO.FromUser(user),
		State = user.GetClientState(),
	};
}
