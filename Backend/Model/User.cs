using Douji.Backend.Exceptions;
using Douji.Backend.Model.ClientStates;

namespace Douji.Backend.Model;

public class User : UserBase
{
	public int? Id { get; set; }

	public string ConnectionId { get; }

	public ClientState ClientState { get; set; }

	public int IdNotNull => Id ?? throw new UnexpectedNullException(nameof(Id), nameof(User));

	public string Secret { get; }



	public User(int? id, string secret, Room room, string name, string connectionId, ClientState? clientState = null)
		: base(room, name)
	{
		Id = id;
		Secret = secret;
		ConnectionId = connectionId;

		if (clientState == null)
		{
			ClientState = new ClientState()
			{
				State = ClientStateEnum.Unstarted,
				UpdatedAt = DateTime.UtcNow,
				VideoTime = null
			};
		}
		else
		{
			ClientState = clientState;
		}
	}

	public override bool IsValid() => base.IsValid() && !string.IsNullOrEmpty(ConnectionId);
}
