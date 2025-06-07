using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Douji.Backend.Migrations
{
	/// <inheritdoc />
	public partial class Initial : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.CreateTable(
				name: "rooms",
				columns: table => new
				{
					id = table.Column<int>(type: "INTEGER", nullable: false)
						.Annotation("Sqlite:Autoincrement", true),
					name = table.Column<string>(type: "TEXT", nullable: false),
					passwordHash = table.Column<string>(type: "TEXT", nullable: true),
					currentlyPlayedUrl = table.Column<string>(type: "TEXT", nullable: true)
				},
				constraints: table => table.PrimaryKey("pK_rooms", x => x.id));

			migrationBuilder.CreateTable(
				name: "users",
				columns: table => new
				{
					id = table.Column<int>(type: "INTEGER", nullable: false)
						.Annotation("Sqlite:Autoincrement", true),
					roomId = table.Column<int>(type: "INTEGER", nullable: false),
					name = table.Column<string>(type: "TEXT", nullable: false),
					connectionId = table.Column<string>(type: "TEXT", nullable: false),
					clientState = table.Column<int>(type: "INTEGER", nullable: false),
					videoTime = table.Column<double>(type: "REAL", nullable: true),
					updatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("pK_users", x => x.id);
					table.ForeignKey(
						name: "fK_users_rooms_roomId",
						column: x => x.roomId,
						principalTable: "rooms",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateIndex(
				name: "iX_users_connectionId",
				table: "users",
				column: "connectionId",
				unique: true);

			migrationBuilder.CreateIndex(
				name: "iX_users_roomId",
				table: "users",
				columns: ["roomId", "name"],
				unique: true);
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropTable(
				name: "users");

			migrationBuilder.DropTable(
				name: "rooms");
		}
	}
}
