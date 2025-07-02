namespace Douji.Backend.Data.Api.Room;

public class RoomAuthenticationResult(string reservationId)
{
	public string ReservationId { get; } = reservationId;
}
