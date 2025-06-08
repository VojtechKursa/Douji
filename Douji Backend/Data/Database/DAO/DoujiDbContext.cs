using Douji.Backend.Data.Database.DTO;
using Microsoft.EntityFrameworkCore;

namespace Douji.Backend.Data.Database.DAO;

public class DoujiDbContext(DbContextOptions options) : DbContext(options)
{
	public required DbSet<RoomDatabaseDTO> Rooms { get; init; }
	public required DbSet<UserDatabaseDTO> Users { get; init; }

	protected override void OnModelCreating(ModelBuilder modelBuilder)
	{
		modelBuilder.Entity<UserDatabaseDTO>()
			.HasOne(user => user.Room)
			.WithMany(room => room.Users)
			.OnDelete(DeleteBehavior.Cascade);
	}
}
