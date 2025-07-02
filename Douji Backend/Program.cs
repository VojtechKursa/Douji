using Douji.Backend.Auth;
using Douji.Backend.Auth.Authentication.RoomAccess;
using Douji.Backend.Auth.Authentication.Skip;
using Douji.Backend.Auth.Authorization.RoomAccess;
using Douji.Backend.Auth.Authorization.RoomAccess.Handlers;
using Douji.Backend.Data.Database.DAO;
using Douji.Backend.Data.Database.Interfaces.DAO;
using Douji.Backend.SignalR.Hubs;
using Microsoft.AspNetCore.Authorization;

namespace Douji.Backend
{
	public class Program
	{
		public static void Main(string[] args)
		{
			var builder = WebApplication.CreateBuilder(args);

			ServicesConfiguration.ConfigureServices(builder);

			var app = builder.Build();

			MiddlewareConfiguration.ConfigureMiddleware(app);

			string[] listenUrls = app.Configuration.GetSection("BackendUrls").Get<string[]>() ?? [];
			foreach (string url in listenUrls)
			{
				app.Urls.Add(url);
			}

			{
				var db = app.Services.GetService<IDoujiInMemoryDb>();

				if (db != null)
				{
					TimeSpan reservationTimeout = app.Environment.IsDevelopment() ? TimeSpan.FromMinutes(5) : TimeSpan.FromMinutes(1);

					PeriodicTasks.ReservationCleanupTask(db.Reservations, reservationTimeout);
				}
			}

			app.Run();
		}

		private static class ServicesConfiguration
		{
			public static void ConfigureServices(WebApplicationBuilder builder)
			{
				AddEndpointServices(builder);

				AddCors(builder);

				AddAuthentication(builder);
				AddAuthorization(builder);

				if (builder.Environment.IsDevelopment())
				{
					AddSwagger(builder);
				}

				AddCustomServices(builder);
			}

			private static void AddCustomServices(WebApplicationBuilder builder) =>
				builder.Services.AddSingleton<IDoujiInMemoryDb, DoujiInMemoryDb>();

			private static void AddEndpointServices(WebApplicationBuilder builder)
			{
				builder.Services.AddControllers();
				builder.Services.AddSignalR(options =>
				{
					if (builder.Environment.IsDevelopment())
					{
						options.EnableDetailedErrors = true;
					}
				});
			}

			private static void AddCors(WebApplicationBuilder builder)
			{
				string[] frontendUrls = builder.Configuration.GetSection("FrontendUrls").Get<string[]>() ?? [];

				if (frontendUrls.Length > 0)
				{
					builder.Services.AddCors(options =>
					{
						options.AddDefaultPolicy(policy =>
						{
							policy.WithOrigins(frontendUrls);
							policy.WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS");
							policy.AllowCredentials();
							policy.AllowAnyHeader();
						});
					});
				}
			}

			private static void AddAuthentication(WebApplicationBuilder builder)
			{
				builder.Services.AddAuthentication(AuthConstants.AuthenticationSchemes.SkipScheme)
					.AddScheme<SkipAuthenticationOptions, SkipAuthenticationHandler>(
						AuthConstants.AuthenticationSchemes.SkipScheme,
						options => { }
					)
					.AddScheme<RoomAccessAuthenticationOptions, RoomAccessAuthenticationHandler>(
						AuthConstants.AuthenticationSchemes.RoomAccessScheme,
						options => options.ClaimsIssuer = AuthConstants.ClaimsIssuerLocal);
			}

			private static void AddAuthorization(WebApplicationBuilder builder)
			{
				builder.Services.AddSingleton<IAuthorizationHandler, RoomAccessAuthorizationHandler>();

				builder.Services.AddAuthorizationBuilder()
					.AddPolicy
					(
						AuthConstants.AuthorizationPolicies.RoomAccessPolicy,
						policy =>
							policy.AddRequirements(new RoomAccessAuthoritationRequirement())
					);
			}

			private static void AddSwagger(WebApplicationBuilder builder)
			{
				builder.Services.AddEndpointsApiExplorer();
				builder.Services.AddSwaggerGen();
			}
		}

		private static class MiddlewareConfiguration
		{
			public static void ConfigureMiddleware(WebApplication app)
			{
				if (app.Environment.IsDevelopment())
				{
					app.UseSwagger();
					app.UseSwaggerUI();
				}

				if (app.Configuration.GetValue<bool?>("HttpsRedirect") ?? true)
				{
					app.UseHttpsRedirection();
				}

				app.UseAuthentication();
				app.UseAuthorization();

				app.MapControllers();
				app.MapHub<RoomHub>("/hub/room");

				app.UseCors();
			}
		}

		private static class PeriodicTasks
		{
			public static Task ReservationCleanupTask(IUserReservationsMemory reservations, TimeSpan reservationTimeout, CancellationToken? cancellationToken = null)
			{
				TimeSpan limit = reservationTimeout;
				TimeSpan period = limit / 4;

				int periodMs = (int)period.TotalMilliseconds;

				async Task function()
				{
					while (true)
					{
						await Task.Delay(periodMs);
						await reservations.RemoveAllOlderThan(limit);
					}
				}

				if (cancellationToken == null)
				{
					return Task.Run(function);
				}
				else
				{
					return Task.Run(function, cancellationToken.Value);
				}
			}
		}
	}
}
