using Microsoft.Extensions.Primitives;

namespace Douji.Backend.SignalR.Data;

public readonly struct RoomAuthenticationData(int roomId, string username, string? password)
{
	public readonly int roomId = roomId;
	public readonly string username = username;
	public readonly string? password = password;

	public static RoomAuthenticationData? FromQuery(IQueryCollection? query)
	{
		if (query == null)
			return null;

		if (!query.TryGetValue("roomId", out StringValues roomIdValues))
			return null;

		if (!int.TryParse(roomIdValues.FirstOrDefault(), out int roomId))
			return null;

		if (!query.TryGetValue("username", out StringValues usernameValues))
			return null;

		string? username = usernameValues.FirstOrDefault();
		if (username == null)
			return null;

		string? password = null;
		if (query.TryGetValue("password", out StringValues passwordValues))
		{
			password = passwordValues.FirstOrDefault();
		}

		return new RoomAuthenticationData(roomId, username, password);
	}

	public static RoomAuthenticationData? FromHeader(IHeaderDictionary? header)
	{
		if (header == null)
			return null;

		if (!header.TryGetValue("X-RoomId", out StringValues roomIdValues))
			return null;

		if (!int.TryParse(roomIdValues.FirstOrDefault(), out var roomId))
			return null;

		if (!header.TryGetValue("X-Username", out StringValues usernameValues))
			return null;

		var username = usernameValues.FirstOrDefault();
		if (username == null)
			return null;

		string? password = null;

		if (!header.TryGetValue("X-Password", out StringValues passwordValues))
		{
			password = passwordValues.First();
		}

		return new RoomAuthenticationData(roomId, username, password);
	}
}
