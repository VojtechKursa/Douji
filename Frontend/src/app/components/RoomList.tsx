import { Table } from "react-bootstrap";
import { Room } from "../lib/Room";
import { RoomListClasses } from "../cssClasses";

export function RoomListEntry({
	room,
	selected,
	setSelectedRoom,
}: {
	room: Room;
	selected: boolean;
	setSelectedRoom: (room: Room) => void;
}) {
	return (
		<tr onClick={() => setSelectedRoom(room)} className={selected ? "room-selected" : ""}>
			<td className={RoomListClasses.cell_roomId}>{room.id}</td>
			<td className={RoomListClasses.cell_roomName}>{room.name}</td>
			<td className={RoomListClasses.cell_roomPassword}>{room.hasPassword ? "Y" : "N"}</td>
		</tr>
	);
}

export function RoomList({
	rooms,
	selectedRoom,
	setSelectedRoom,
}: {
	rooms: Room[];
	selectedRoom: Room | undefined;
	setSelectedRoom: (room: Room) => void;
}) {
	return (
		<Table striped bordered hover>
			<thead>
				<tr>
					<th className={RoomListClasses.cell_roomId}>ID</th>
					<th className={RoomListClasses.cell_roomName}>Name</th>
					<th className={RoomListClasses.cell_roomPassword}>Password</th>
				</tr>
			</thead>
			<tbody>
				{rooms.map((room) => (
					<RoomListEntry
						key={room.id}
						room={room}
						setSelectedRoom={setSelectedRoom}
						selected={room.id === selectedRoom?.id}
					/>
				))}
			</tbody>
		</Table>
	);
}
