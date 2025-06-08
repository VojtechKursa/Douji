using Douji.Backend.Data.Database.DAO;
using Douji.Backend.SignalR.Hubs;
using Microsoft.EntityFrameworkCore;

namespace Douji.Backend
{
	public class Program
	{
		public static void Main(string[] args)
		{
			var builder = WebApplication.CreateBuilder(args);

			builder.Services.AddDbContext<DoujiDbContext>(options =>
			{
				options
					.UseLazyLoadingProxies()
					.UseSqlite(builder.Configuration.GetConnectionString("sqlite") ?? throw new Exception())
					.UseCamelCaseNamingConvention();
			});

			builder.Services.AddControllers();
			builder.Services.AddSignalR(options =>
			{
				if (builder.Environment.IsDevelopment())
				{
					options.EnableDetailedErrors = true;
				}
			});

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

			// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
			builder.Services.AddEndpointsApiExplorer();
			builder.Services.AddSwaggerGen();

			var app = builder.Build();

			if (builder.Configuration.GetValue<bool?>("AutoMigrate") ?? false)
			{
				using var scope = app.Services.CreateScope();

				using var db = scope.ServiceProvider.GetService<DoujiDbContext>() ?? throw new Exception();
				db.Database.Migrate();
			}

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
