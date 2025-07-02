using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace Douji.Backend.Auth.Authentication.Skip;

public class SkipAuthenticationHandler(IOptionsMonitor<SkipAuthenticationOptions> options, ILoggerFactory logger, UrlEncoder encoder)
	: AuthenticationHandler<SkipAuthenticationOptions>(options, logger, encoder)
{
	protected override Task<AuthenticateResult> HandleAuthenticateAsync()
		=> Task.FromResult(AuthenticateResult.NoResult());
}
