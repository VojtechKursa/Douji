using System.Security.Claims;
using Douji.Backend.Auth;
using Douji.Backend.Data;
using Douji.Backend.Data.Api.Room;
using Douji.Backend.Data.Database.Interfaces.DAO;
using Douji.Backend.Model;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Douji.Backend.Controllers;

[ApiController]
[Route("/api/room")]
[AllowAnonymous]
public class RoomController(IDoujiInMemoryDb database) : Controller
{
	private readonly IDoujiInMemoryDb db = database;

	[HttpGet]
	public IActionResult List() => Ok(db.Rooms.List().OrderBy(r => r.Id).Select(RoomApiResponse.FromRoom));

	[HttpGet("{id}")]
	public IActionResult Get(int id)
	{
		var room = db.Rooms.Get(id);

		return room == null ? NotFound() : Ok(RoomApiResponse.FromRoom(room));
	}

	[HttpPut]
	public IActionResult Create(RoomApiCreateRequest request)
	{
		var newRoom = Room.FromApiRequest(request);
		if (!newRoom.IsValid())
		{
			return BadRequest();
		}

		if (db.Rooms.Create(newRoom))
		{
			return Created($"{HttpContext.Request.Host.Value}/api/room/{newRoom.Id}", RoomApiResponse.FromRoom(newRoom));
		}
		else
		{
			return BadRequest();
		}
	}

	[HttpPost("{id}")]
	public IActionResult Update(int id, RoomApiUpdateRequest update)
	{
		var room = db.Rooms.Get(id);

		if (room == null) return NotFound();

		bool updateSuccess = room.Update(update);

		return updateSuccess ? Ok(RoomApiResponse.FromRoom(room)) : BadRequest();
	}

	[HttpDelete("{id}")]
	public IActionResult Delete(int id)
	{
		var room = db.Rooms.Get(id);

		if (room == null) return NotFound();

		db.Rooms.Delete(room.IdNotNull);

		return NoContent();
	}

	[HttpPost("auth")]
	public async Task<IActionResult> Authenticate([FromQuery] int roomId, [FromBody] RoomAuthenticationRequest request)
	{
		if (!request.IsValid()) return BadRequest();

		var room = db.Rooms.Get(roomId);

		if (room == null) return NotFound();

		if (room.PasswordHash != null)
		{
			if (request.Password == null)
			{
				return Unauthorized();
			}

			if (room.PasswordHash != Hash.ToHex(await Hash.DigestAsync(request.Password)))
			{
				return Unauthorized();
			}
		}
		else if (request.Password != null)
		{
			return Unauthorized();
		}

		UserReservation? reservation = null;

		do
		{
			reservation = await room.ReserveName(request.Username);

			if (reservation == null)
			{
				return Conflict();
			}

			if (!db.Reservations.Create(reservation))
			{
				await room.CancelReservation(request.Username);
				reservation = null;
			}
		} while (reservation == null);

		return Ok(new RoomAuthenticationResult(reservation.Id));
	}
}
