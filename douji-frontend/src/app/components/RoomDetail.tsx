import { Button, Form, Table } from "react-bootstrap";
import { Room } from "../lib/Room";
import { useState } from "react";
import { ConnectionParameters } from "../lib/ConnectionParameters";
import { joinRoom } from "../lib/JoinNegotiator";

export function RoomDetail({ selectedRoom }: { selectedRoom: Room | undefined }) {
	const [username, setUsername] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [joining, setJoining] = useState<boolean>(false);
	const [authError, setAuthError] = useState<string>("");

	async function handleJoin(): Promise<void> {
		if (selectedRoom == undefined) return;

		const room = selectedRoom;

		setJoining(true);

		const joinResult = await joinRoom(room.id, username, password.length > 0 ? password : undefined);

		if (joinResult instanceof ConnectionParameters) {
			joinResult.save();
			window.location.href = `/room?roomId=${room.id}`;
		} else {
			setAuthError(joinResult);
		}

		setJoining(false);
	}

	return (
		<div>
			<div className="d-flex justify-content-center pt-3 pb-1">
				<Table striped bordered size="sm" className="w-75 mb-0">
					<tbody>
						<tr>
							<td>ID</td>
							<td>{selectedRoom?.id ?? ""}</td>
						</tr>
						<tr>
							<td>Name</td>
							<td>{selectedRoom?.name ?? ""}</td>
						</tr>
						<tr>
							<td>Password</td>
							<td>{selectedRoom == undefined ? "" : selectedRoom.hasPassword ? "Yes" : "No"}</td>
						</tr>
					</tbody>
				</Table>
			</div>
			<Form>
				<Form.Group>
					<Form.Label>Username</Form.Label>
					<Form.Control
						type="text"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						isInvalid={username.length <= 0}
					/>
					<Form.Control.Feedback type="invalid">
						{"Enter a username under which you'll join the selected room"}
					</Form.Control.Feedback>
				</Form.Group>
				{selectedRoom?.hasPassword && (
					<Form.Group>
						<Form.Label>Password</Form.Label>
						<Form.Control
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							isInvalid={selectedRoom != undefined && selectedRoom.hasPassword && password.length <= 0}
						/>
						<Form.Control.Feedback type="invalid">
							Password is required to join this room.
						</Form.Control.Feedback>
					</Form.Group>
				)}
				<Button
					onClick={handleJoin}
					disabled={
						selectedRoom == undefined || (selectedRoom.hasPassword && password.length <= 0) || joining
					}
				>
					Join
				</Button>
				{authError.length > 0 && <div className="text-danger">{authError}</div>}
			</Form>
		</div>
	);
}
