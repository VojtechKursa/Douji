using Douji.Backend.Data;
using Douji.Backend.Data.Api.Room;
using Douji.Backend.Data.Database.DTO;
using Douji.Backend.Data.State;

namespace Douji.Backend.Model;

public class Room
{
	public int? Id { get; set; }

	public string Name { get; set; }

	public string? PasswordHash { get; set; }

	public string? CurrentlyPlayedUrl { get; set; }

	public RoomState RoomState { get; set; }

	public bool HasPassword => PasswordHash != null;



	public Room(int? id, string name, string? passwordHash, RoomState? roomState = null, string? currentlyPlayedUrl = null)
	{
		Id = id;
		Name = name;
		PasswordHash = passwordHash;
		CurrentlyPlayedUrl = currentlyPlayedUrl;

		if (roomState == null)
		{
			RoomState = new RoomStateUnstarted(DateTime.UtcNow);
		}
		else
		{
			RoomState = roomState;
		}
	}



	public void Update(RoomApiUpdateRequest newRoom)
	{
		Name = newRoom.Name;

		if (newRoom.RemovePassword)
		{
			PasswordHash = null;
		}
		else if (newRoom.NewPassword != null)
		{
			PasswordHash = Hash.ToHex(Hash.Digest(newRoom.NewPassword));
		}
	}

	public static Room FromApiRequest(RoomApiCreateRequest request)
	{
		string? passwordHash = request.Password != null ? Hash.ToHex(Hash.Digest(request.Password)) : null;

		return new Room(null, request.Name, passwordHash);
	}

	public RoomDatabaseDTO ToDatabaseDTO()
	{
		return new RoomDatabaseDTO()
		{
			Id = Id ?? 0,
			Name = Name,
			PasswordHash = PasswordHash,
			CurrentlyPlayedUrl = CurrentlyPlayedUrl,
			RoomState = RoomState.State,
			VideoTime = RoomState.VideoTime,
			RoomStateUpdatedAt = RoomState.UpdatedAt,
		};
	}

	public static Room FromDatabaseDTO(RoomDatabaseDTO dto) => new(
		dto.Id,
		dto.Name,
		dto.PasswordHash,
		dto.GetRoomState(),
		dto.CurrentlyPlayedUrl
	);
}

public static class RoomDatabaseDTOExtensions
{
	public static RoomState GetRoomState(this RoomDatabaseDTO dto)
	{
		return dto.RoomState switch
		{
			RoomStateEnum.Unstarted => new RoomStateUnstarted(dto.RoomStateUpdatedAt),
			RoomStateEnum.Ended => new RoomStateEnded(dto.RoomStateUpdatedAt),
			RoomStateEnum.Playing => new RoomStatePlaying(dto.GetVideoTime(), dto.RoomStateUpdatedAt),
			RoomStateEnum.Paused => new RoomStatePaused(dto.GetVideoTime(), dto.RoomStateUpdatedAt),
			RoomStateEnum.Waiting => new RoomStateWaiting(dto.GetVideoTime(), dto.RoomStateUpdatedAt),
			_ => throw new Exception(),
		};
	}

	public static double GetVideoTime(this RoomDatabaseDTO dto)
	{
		if (!dto.VideoTime.HasValue)
			throw new Exception();

		return dto.VideoTime.Value;
	}
}
