using Douji.Backend.Model;

namespace Douji.Backend.SignalR.Data;

public class HubUserDTO
{
	public required string Name { get; set; }

	public static HubUserDTO FromUser(User user) => new()
	{
		Name = user.Name
	};
}
