import { useState } from "react";
import { Room } from "../lib/Room";
import { Button, Form } from "react-bootstrap";
import { ConnectionParameters } from "../lib/ConnectionParameters";
import { joinRoom } from "../lib/JoinNegotiator";
import { Service, ServicesResolver } from "../lib/ServicesResolver";

abstract class RoomCreationResult {
	public constructor(public readonly successful: boolean) {}
}

class RoomCreationResultSuccess extends RoomCreationResult {
	public constructor(public readonly room: Room) {
		super(true);
	}
}

class RoomCreationResultFail extends RoomCreationResult {
	public constructor(public readonly message?: string) {
		super(false);
	}
}

export function RoomCreation() {
	const [name, setName] = useState<string>("");
	const [nameError, setNameError] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [username, setUsername] = useState<string>("");
	const [creating, setCreating] = useState<boolean>(false);
	const [roomCreationResult, setRoomCreationResult] = useState<RoomCreationResult>();

	async function createRoom() {
		if (name == undefined || name.length <= 0) {
			setNameError("Name must be specified");
			return;
		}

		setCreating(true);

		const actualPassword = password != undefined && password.length > 0 ? password : undefined;

		const requestBody = JSON.stringify({ name: name, password: actualPassword });

		const backendUrl = await ServicesResolver.instance.getService(Service.Backend);

		const response = await fetch(`${backendUrl}/api/room`, {
			method: "PUT",
			body: requestBody,
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (response.status == 201) {
			const createdRoom = await response.json();

			setRoomCreationResult(new RoomCreationResultSuccess(createdRoom));

			const joinResult = await joinRoom(createdRoom.id, username, actualPassword);

			if (joinResult instanceof ConnectionParameters) {
				joinResult.save();
				window.location.href = `/room?roomId=${createdRoom.id}`;
			} else {
				setRoomCreationResult(
					new RoomCreationResultFail(
						"Room was successfully created, but attempt to join resulted in error: " + joinResult
					)
				);
			}
		} else {
			setRoomCreationResult(new RoomCreationResultFail("Room with identical name probably exists."));
		}

		setCreating(false);
	}

	return (
		<Form>
			<Form.Group>
				<Form.Label>Room name</Form.Label>
				<Form.Control
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					disabled={creating}
					isInvalid={nameError.length > 0}
				/>
				<Form.Control.Feedback type={nameError.length > 0 ? "invalid" : "valid"}>
					{nameError}
				</Form.Control.Feedback>
			</Form.Group>
			<Form.Group>
				<Form.Label>Room password</Form.Label>
				<Form.Control
					type="password"
					value={password}
					disabled={creating}
					onChange={(e) => setPassword(e.target.value)}
				/>
			</Form.Group>
			<Form.Group>
				<Form.Label>Username</Form.Label>
				<Form.Control
					type="text"
					value={username}
					disabled={creating}
					onChange={(e) => setUsername(e.target.value)}
					isInvalid={username.length <= 0}
				/>
				<Form.Control.Feedback type="invalid">
					{"Please specify username under which you'll join your created room"}
				</Form.Control.Feedback>
			</Form.Group>
			<Button onClick={createRoom} disabled={creating}>
				Create room
			</Button>
			<Form.Text className={roomCreationResult?.successful ? "text-success" : "text-danger"}>
				{roomCreationResult instanceof RoomCreationResultFail
					? roomCreationResult.message
					: roomCreationResult instanceof RoomCreationResultSuccess && "Room successfully created"}
			</Form.Text>
		</Form>
	);
}
