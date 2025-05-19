"use client";

import { useEffect, useState } from "react";
import { Room } from "./lib/Room";
import { RoomList } from "./components/RoomList";
import { RoomDetail } from "./components/RoomDetail";
import ClientConfig from "./lib/ClientConfig";

export default function RoomListPage() {
	const [selectedRoom, setSelectedRoom] = useState<Room>();
	const [displayedRooms, setDisplayedRooms] = useState<Room[]>([]);

	useEffect(() => {
		fetch(`${ClientConfig.backendUrl}/api/room`)
			.then((result) => result.json())
			.then((json) => {
				if (!Array.isArray(json)) throw new Error();
				else setDisplayedRooms(json);
			});
	}, []);

	return (
		<div>
			<div>
				<RoomList
					setSelectedRoom={setSelectedRoom}
					rooms={displayedRooms}
				/>
			</div>
			<div>
				<RoomDetail selectedRoom={selectedRoom} />
			</div>
		</div>
	);
}
