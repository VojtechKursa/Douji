using Douji.Backend.Data.Database.DTO;
using Douji.Backend.Data.State;

namespace Douji.Backend.Model;

public class User
{
	public int Id { get; }

	public Room Room { get; }

	public string Name { get; set; }

	public string ConnectionId { get; }

	public ClientState ClientState { get; set; }



	public User(int id, Room room, string name, string connectionId, ClientState? clientState = null)
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



	public UserDatabaseDTO ToDatabaseDTO()
	{
		return new UserDatabaseDTO()
		{
			Id = Id,
			Room = Room.ToDatabaseDTO(),
			Name = Name,
			ConnectionId = ConnectionId,
			ClientState = ClientState.State,
			UpdatedAt = ClientState.UpdatedAt,
			VideoTime = ClientState.VideoTime,
		};
	}

	public static User FromDatabaseDTO(UserDatabaseDTO dto) => new(
		dto.Id,
		Room.FromDatabaseDTO(dto.Room),
		dto.Name,
		dto.ConnectionId,
		dto.GetClientState()
	);
}

public static class UserDatabaseDTOExtensions
{
	public static ClientState GetClientState(this UserDatabaseDTO dto)
	{
		return new ClientState()
		{
			State = dto.ClientState,
			VideoTime = dto.VideoTime,
			UpdatedAt = dto.UpdatedAt
		};
	}
}
