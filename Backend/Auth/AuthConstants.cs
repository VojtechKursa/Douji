namespace Douji.Backend.Auth;

public static class AuthConstants
{
	public static class AuthenticationSchemes
	{
		public const string RoomAccessScheme = "RoomAccess";
		public const string SkipScheme = "Skip";
	}

	public static class Claims
	{
		public const string AuthorizedRoomIdClaim = "AuthorizedRoomId";
		public const string RequestedRoomIdClaim = "RequestedRoomId";
		public const string UsernameClaim = "Username";
		public const string ReservationIdClaim = "ReservationId";
		public const string HttpMethodClaim = "HttpMethod";
	}

	public static class AuthorizationPolicies
	{
		public const string RoomAccessPolicy = "RoomAccessPolicy";
	}

	public const string ClaimsIssuerLocal = "Douji";
}
