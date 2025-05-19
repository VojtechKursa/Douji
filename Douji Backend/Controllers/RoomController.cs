using Douji.Backend.Data.Api.Room;
using Douji.Backend.Data.Database;
using Douji.Backend.Model;
using Microsoft.AspNetCore.Mvc;

namespace Douji.Backend.Controllers;

[ApiController]
[Route("/api/room")]
public class RoomController(DoujiDbContext database) : Controller
{
	private readonly DoujiDbContext db = database;

	[HttpGet]
	public IEnumerable<RoomApiResponse> List() => db.Rooms.OrderBy(r => r.Id).Select(RoomApiResponse.FromRoom);

	[HttpGet("{id}")]
	public IActionResult Get(int id)
	{
		Room? room = db.Rooms.Where(room => room.Id == id).FirstOrDefault();

		return room == null ? NotFound() : Ok(RoomApiResponse.FromRoom(room));
	}

	[HttpPut]
	public IActionResult Create(RoomApiCreateRequest request)
	{
		Room newRoom = Room.FromApiRequest(request);

		db.Rooms.Add(newRoom);
		db.SaveChanges();
		return Created($"{HttpContext.Request.Host.Value}/api/room/{newRoom.Id}", RoomApiResponse.FromRoom(newRoom));
	}

	[HttpPost("{id}")]
	public IActionResult Update(int id, RoomApiUpdateRequest update)
	{
		Room? room = db.Rooms.Where(room => room.Id == id).FirstOrDefault();

		if (room == null) return NotFound();

		room.Update(update);
		db.Update(room);
		db.SaveChanges();

		return Ok(RoomApiResponse.FromRoom(room));
	}

	[HttpDelete("{id}")]
	public IActionResult Delete(int id)
	{
		Room? room = db.Rooms.Where(room => room.Id == id).FirstOrDefault();

		if (room == null) return NotFound();

		db.Rooms.Remove(room);
		db.SaveChanges();

		return NoContent();
	}
}
