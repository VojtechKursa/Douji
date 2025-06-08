using Douji.Backend.Exceptions;
using Douji.Backend.Model.ClientStates;

namespace Douji.Backend.Model;

public class User
{
	public int? Id { get; }

	public Room Room { get; }

	public string Name { get; set; }

	public string ConnectionId { get; }

	public ClientState ClientState { get; set; }

	public int IdNotNull => Id ?? throw new UnexpectedNullException(nameof(Id), nameof(User));



	public User(int? id, Room room, string name, string connectionId, ClientState? clientState = null)
	{
		Id = id;
		Room = room;
		Name = name;
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
}
