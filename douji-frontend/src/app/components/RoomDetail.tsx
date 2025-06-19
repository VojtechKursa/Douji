import { Button, Form, Table } from "react-bootstrap";
import { ConnectionParameters } from "../lib/ConnectionParameters";
import { Room } from "../lib/Room";
import { useState } from "react";

export function RoomDetail({ selectedRoom }: { selectedRoom: Room | undefined }) {
	const [username, setUsername] = useState<string>("");
	const [password, setPassword] = useState<string>("");

	function handleJoin() {
		if (selectedRoom == undefined) return;

		new ConnectionParameters(selectedRoom.id, username, password).save();

		window.location.href = `/room?roomId=${selectedRoom.id}`;
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
					disabled={selectedRoom == undefined || (selectedRoom.hasPassword && password.length <= 0)}
				>
					Join
				</Button>
			</Form>
		</div>
	);
}
