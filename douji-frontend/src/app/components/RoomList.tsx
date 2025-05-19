import { Room } from "../lib/Room";

export function RoomListEntry({
	room,
	setSelectedRoom,
}: {
	room: Room;
	setSelectedRoom: (room: Room) => void;
}) {
	return (
		<li onClick={() => setSelectedRoom(room)}>
			{room.name} ({room.id}){room.hasPassword ? " PASSWORD" : ""}
		</li>
	);
}

export function RoomList({
	rooms,
	setSelectedRoom,
}: {
	rooms: Room[];
	setSelectedRoom: (room: Room) => void;
}) {
	return (
		<ul>
			{rooms.map((room) => (
				<RoomListEntry key={room.id} room={room} setSelectedRoom={setSelectedRoom} />
			))}
		</ul>
	);
}
