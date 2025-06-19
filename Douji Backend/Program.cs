using Douji.Backend.Data.Database.DAO;
using Douji.Backend.Data.Database.Interfaces.DAO;
using Douji.Backend.SignalR.Hubs;

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

			app.Run();
		}

		private static class ServicesConfiguration
		{
			public static void ConfigureServices(WebApplicationBuilder builder)
			{
				AddEndpointServices(builder);
				AddSecurityServices(builder);
				AddSwagger(builder);
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

			private static void AddSecurityServices(WebApplicationBuilder builder)
			{
				string[] frontendUrls = builder.Configuration.GetSection("FrontendUrls").Get<string[]>() ?? [];

				if (frontendUrls.Length > 0)
				{
					builder.Services.AddCors(options =>
					{
						options.AddDefaultPolicy(policy =>
						{
							policy.WithOrigins(frontendUrls);
							policy.WithMethods("GET", "POST", "PUT", "DELETE");
							policy.AllowCredentials();
							policy.AllowAnyHeader();
						});
					});
				}
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

				app.UseAuthorization();

				app.MapControllers();
				app.MapHub<RoomHub>("/hub/room");

				app.UseCors();
			}
		}
	}
}
