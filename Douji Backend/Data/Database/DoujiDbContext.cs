using Douji.Backend.Model;
using Microsoft.EntityFrameworkCore;

namespace Douji.Backend.Data.Database;

public class DoujiDbContext(DbContextOptions options) : DbContext(options)
{
	public required DbSet<Room> Rooms { get; init; }
	public required DbSet<User> Users { get; init; }

	protected override void OnModelCreating(ModelBuilder modelBuilder)
	{
		modelBuilder.Entity<User>()
			.HasOne(user => user.Room)
			.WithMany(room => room.Users)
			.OnDelete(DeleteBehavior.Cascade);
	}
}
