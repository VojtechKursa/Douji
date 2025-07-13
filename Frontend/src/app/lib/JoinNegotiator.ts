import { ConnectionParameters } from "./ConnectionParameters";
import { UnreachableError } from "./Errors/UnreachableError";
import { Service, ServicesResolver } from "./ServicesResolver";

export async function joinRoom(
	roomId: number,
	username: string,
	password?: string
): Promise<ConnectionParameters | string> {
	const backendUrl = await ServicesResolver.instance.getService(Service.Backend);

	const authenticationResult = await fetch(`${backendUrl}/api/room/auth?roomId=${roomId}`, {
		body: JSON.stringify({
			username: username,
			password: password == undefined ? undefined : password.length > 0 ? password : undefined,
		}),
		method: "POST",
		cache: "no-cache",
		headers: [["Content-Type", "application/json"]],
	});

	if (authenticationResult.ok) {
		const result = await authenticationResult.json();
		const reservationId = result["reservationId"];

		if (reservationId == undefined || reservationId == null || typeof reservationId !== "string")
			throw new UnreachableError("Invalid reservation ID received.");

		return new ConnectionParameters(roomId, username, reservationId);
	} else {
		switch (authenticationResult.status) {
			case 400:
				return "Invalid username.";
			case 401:
				return "Invalid password.";
			case 404:
				return "Room no longer exists.";
			case 409:
				return "User with identical name already exists in the room.";
			default:
				return "Unknown authentication error.";
		}
	}
}
