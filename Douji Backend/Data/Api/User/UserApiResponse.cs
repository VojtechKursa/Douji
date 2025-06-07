using Douji.Backend.Model;

namespace Douji.Backend.Data.Api.User;

public class UserApiResponse
{
	public required string Name { get; set; }

	public required ClientState State { get; set; }

	public static UserApiResponse FromUser(Model.User user)
	{
		return new UserApiResponse()
		{
			Name = user.Name,
			State = user.GetClientState(),
		};
	}
}
