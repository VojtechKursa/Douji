using Microsoft.AspNetCore.Authorization;

namespace Douji.Backend.Auth.Authorization.RoomAccess.Handlers;

public class RoomAccessAuthorizationHandler : AuthorizationHandler<RoomAccessAuthoritationRequirement>
{
	protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, RoomAccessAuthoritationRequirement requirement)
	{
		if (context.User.Claims.Any(claim =>
			claim.Issuer == AuthConstants.ClaimsIssuerLocal &&
			claim.Type == AuthConstants.Claims.HttpMethodClaim &&
			claim.Value == "OPTIONS"
		))
		{
			context.Succeed(requirement);
		}
		else
		{
			var requestedRoomId = context.User.Claims.FirstOrDefault(
				claim => claim.Issuer == AuthConstants.ClaimsIssuerLocal && claim.Type == AuthConstants.Claims.RequestedRoomIdClaim
			)?.Value;

			if (requestedRoomId != null)
			{
				if
				(
					context.User.HasClaim
					(
						claim =>
							claim.Issuer == AuthConstants.ClaimsIssuerLocal &&
							claim.Type == AuthConstants.Claims.AuthorizedRoomIdClaim &&
							claim.Value == requestedRoomId
					)
				)
				{
					context.Succeed(requirement);
				}
			}
		}

		return Task.CompletedTask;
	}
}
