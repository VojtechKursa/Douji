using Douji.Backend.Data.Api.User;
using Douji.Backend.Model;

namespace Douji.Backend.SignalR.Data;

public class HubUserDTO : UserApiResponse
{
	public static new HubUserDTO FromUser(User user) => new() { Name = user.Name };
}
