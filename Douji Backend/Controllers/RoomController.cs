using Douji.Backend.Data.Api.Room;
using Douji.Backend.Data.Database.DAO;
using Douji.Backend.Model;
using Microsoft.AspNetCore.Mvc;

namespace Douji.Backend.Controllers;

[ApiController]
[Route("/api/room")]
public class RoomController(DoujiDbContext database) : Controller
{
	private readonly DoujiDbContext db = database;

	[HttpGet]
	public IActionResult List() => Ok(db.Rooms.OrderBy(r => r.Id).Select(RoomApiResponse.FromRoomDatabaseDTO));

	[HttpGet("{id}")]
	public IActionResult Get(int id)
	{
		var roomDTO = db.Rooms.Where(room => room.Id == id).FirstOrDefault();

		return roomDTO == null ? NotFound() : Ok(RoomApiResponse.FromRoomDatabaseDTO(roomDTO));
	}

	[HttpPut]
	public IActionResult Create(RoomApiCreateRequest request)
	{
		var newRoom = Room.FromApiRequest(request).ToDatabaseDTO();

		db.Rooms.Add(newRoom);
		db.SaveChanges();

		return Created($"{HttpContext.Request.Host.Value}/api/room/{newRoom.Id}", RoomApiResponse.FromRoomDatabaseDTO(newRoom));
	}

	[HttpPost("{id}")]
	public IActionResult Update(int id, RoomApiUpdateRequest update)
	{
		var roomDTO = db.Rooms.Where(room => room.Id == id).FirstOrDefault();

		if (roomDTO == null) return NotFound();

		Room room = Room.FromDatabaseDTO(roomDTO);
		room.Update(update);

		var newRoomDTO = room.ToDatabaseDTO();

		db.Update(newRoomDTO);
		db.SaveChanges();

		return Ok(RoomApiResponse.FromRoomDatabaseDTO(newRoomDTO));
	}

	[HttpDelete("{id}")]
	public IActionResult Delete(int id)
	{
		var room = db.Rooms.Where(room => room.Id == id).FirstOrDefault();

		if (room == null) return NotFound();

		db.Rooms.Remove(room);
		db.SaveChanges();

		return NoContent();
	}
}
