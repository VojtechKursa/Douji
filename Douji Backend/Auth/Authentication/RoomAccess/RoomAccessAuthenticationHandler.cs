using System.Security.Claims;
using System.Text.Encodings.Web;
using Douji.Backend.Data.Database.Interfaces.DAO;
using Douji.Backend.Model;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;

namespace Douji.Backend.Auth.Authentication.RoomAccess;

public class RoomAccessAuthenticationHandler(
	IDoujiInMemoryDb db,
	IOptionsMonitor<RoomAccessAuthenticationOptions> options,
	ILoggerFactory logger,
	UrlEncoder encoder
) : AuthenticationHandler<RoomAccessAuthenticationOptions>(options, logger, encoder)
{
	private readonly IDoujiInMemoryDb db = db;

	protected override Task<AuthenticateResult> HandleAuthenticateAsync()
	{
		if (Context.Request.Method == "OPTIONS")
		{
			return Task.FromResult(
				AuthenticateResult.Success(
					new AuthenticationTicket(
						new ClaimsPrincipal(
							new ClaimsIdentity(
								[
									new Claim
									(
										AuthConstants.Claims.HttpMethodClaim,
										"OPTIONS",
										ClaimValueTypes.String,
										Options.ClaimsIssuer
									),
								]
							)
						),
						AuthConstants.AuthenticationSchemes.RoomAccessScheme
					)
				)
			);
		}

		Room? room = null;
		{
			if (!Context.Request.Query.TryGetValue("roomId", out StringValues roomIdStrings))
			{
				return Task.FromResult(AuthenticateResult.Fail("No room ID specified"));
			}

			if (roomIdStrings.Count > 1)
			{
				return Task.FromResult(AuthenticateResult.Fail("Multiple room IDs specified"));
			}

			string? roomIdStr = roomIdStrings.FirstOrDefault();

			if (roomIdStr == null)
			{
				return Task.FromResult(AuthenticateResult.Fail("No room ID specified"));
			}

			if (!int.TryParse(roomIdStr, out int roomId))
			{
				return Task.FromResult(AuthenticateResult.Fail("Invalid room ID"));
			}

			room = db.Rooms.Get(roomId);

			if (room == null)
			{
				return Task.FromResult(AuthenticateResult.Fail("Invalid room ID"));
			}
		}

		string? username = null;
		{
			if (!Context.Request.Query.TryGetValue("username", out StringValues usernames))
			{
				return Task.FromResult(AuthenticateResult.Fail("No username specified"));
			}

			if (usernames.Count > 1)
			{
				return Task.FromResult(AuthenticateResult.Fail("Multiple usernames specified"));
			}

			username = usernames.FirstOrDefault();

			if (username == null)
			{
				return Task.FromResult(AuthenticateResult.Fail("No username specified"));
			}
		}

		string? reservationId = null;
		{
			if (!Context.Request.Query.TryGetValue("reservation", out StringValues reservationIds))
			{
				return Task.FromResult(AuthenticateResult.Fail("No reservation ID specified"));
			}

			if (reservationIds.Count > 1)
			{
				return Task.FromResult(AuthenticateResult.Fail("Multiple reservations specified"));
			}

			reservationId = reservationIds.FirstOrDefault();

			if (reservationId == null)
			{
				return Task.FromResult(AuthenticateResult.Fail("No reservation ID specified"));
			}
		}

		var user = db.Users.Get(room, username);

		if (user != null)
		{
			if (user.Secret != reservationId)
			{
				return Task.FromResult(AuthenticateResult.Fail("Invalid username or reservation"));
			}
		}
		else
		{
			var reservation = db.Reservations.Get(reservationId);

			if (reservation == null || username != reservation.Name)
			{
				return Task.FromResult(AuthenticateResult.Fail("Invalid username or reservation"));
			}
		}

		ClaimsIdentity identity = new([
			new Claim
			(
				AuthConstants.Claims.RequestedRoomIdClaim,
				room.IdNotNull.ToString(),
				ClaimValueTypes.Integer32,
				Options.ClaimsIssuer
			),
			new Claim
			(
				AuthConstants.Claims.AuthorizedRoomIdClaim,
				room.IdNotNull.ToString(),
				ClaimValueTypes.Integer32,
				Options.ClaimsIssuer
			),
			new Claim
			(
				AuthConstants.Claims.UsernameClaim,
				username,
				ClaimValueTypes.String,
				Options.ClaimsIssuer
			),
			new Claim
			(
				AuthConstants.Claims.ReservationIdClaim,
				reservationId,
				ClaimValueTypes.String,
				Options.ClaimsIssuer
			)
		]);

		AuthenticationTicket ticket = new(
			new ClaimsPrincipal(identity),
			AuthConstants.AuthenticationSchemes.RoomAccessScheme
		);

		return Task.FromResult(AuthenticateResult.Success(ticket));
	}
}
