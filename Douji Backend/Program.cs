using Douji.Backend.Data.Database.DAO;
using Douji.Backend.Data.Database.Interfaces.DAO;
using Douji.Backend.SignalR.Hubs;

namespace Douji.Backend
{
	public class Program
	{
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
			builder.Services.AddCors(options =>
			{
				options.AddDefaultPolicy(policy =>
				{
					policy.WithOrigins("http://localhost:3000");
					policy.WithMethods("GET", "POST", "PUT", "DELETE");
					policy.AllowCredentials();
					policy.AllowAnyHeader();
				});
			});
		}

		private static void AddSwagger(WebApplicationBuilder builder)
		{
			builder.Services.AddEndpointsApiExplorer();
			builder.Services.AddSwaggerGen();
		}

		public static void Main(string[] args)
		{
			var builder = WebApplication.CreateBuilder(args);

			AddEndpointServices(builder);
			AddSecurityServices(builder);
			AddSwagger(builder);
			AddCustomServices(builder);

			var app = builder.Build();

			// Configure the HTTP request pipeline.
			if (app.Environment.IsDevelopment())
			{
				app.UseSwagger();
				app.UseSwaggerUI();
			}

			if (builder.Configuration.GetValue<bool?>("HttpsRedirect") ?? true)
			{
				app.UseHttpsRedirection();
			}

			app.UseAuthorization();

			app.MapControllers();
			app.MapHub<RoomHub>("/hub/room");
			app.UseCors();

			app.Run();
		}
	}
}
