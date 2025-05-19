import { ConnectionParameters } from "../lib/ConnectionParameters";
import { Room } from "../lib/Room";

export function RoomDetail({
	selectedRoom,
}: {
	selectedRoom: Room | undefined;
}) {
	function handleJoin() {
		const passwordInput = document.getElementById(
			"password"
		) as HTMLInputElement | null;
		const password = passwordInput?.value;

		if (selectedRoom == undefined) return;

		const username = (
			document.getElementById("username") as HTMLInputElement
		).value;

		new ConnectionParameters(selectedRoom.id, username, password).save();

		window.location.href = `/room?roomId=${selectedRoom.id}`;
	}

	return (
		<div>
			<div>ID: {selectedRoom?.id}</div>
			<div>Name: {selectedRoom?.name}</div>
			<div>
				Password protected: {selectedRoom?.hasPassword ? "Y" : "N"}
			</div>
			<div>
				<label htmlFor="username">Username:</label>
				<input id="username" type="text"></input>
			</div>
			{selectedRoom?.hasPassword ? (
				<div>
					<label htmlFor="password">Password:</label>
					<input id="password" type="password"></input>
				</div>
			) : (
				""
			)}

			<button onClick={handleJoin} disabled={selectedRoom == undefined}>
				Join
			</button>
		</div>
	);
}
