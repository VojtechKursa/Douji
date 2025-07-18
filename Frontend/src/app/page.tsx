"use client";

import "./style.scss";

import { useEffect, useState } from "react";
import { Room } from "./lib/Room";
import { RoomList } from "./components/RoomList";
import { RoomDetail } from "./components/RoomDetail";
import { RoomCreation } from "./components/RoomCreation";
import { Service, ServicesResolver } from "./lib/ServicesResolver";
import { Col, Row, Tab, Tabs } from "react-bootstrap";

export default function RoomListPage() {
	const [selectedRoom, setSelectedRoom] = useState<Room>();
	const [displayedRooms, setDisplayedRooms] = useState<Room[]>([]);

	useEffect(() => {
		ServicesResolver.instance.getService(Service.Backend).then((backendUrl) => {
			fetch(`${backendUrl}/api/room`)
				.then((result) => result.json())
				.then((json) => {
					if (!Array.isArray(json)) throw new Error();
					else setDisplayedRooms(json);
				});
		});
	}, []);

	return (
		<Row className="m-0">
			<Col xs={12} md={6} className="px-0">
				<RoomList selectedRoom={selectedRoom} setSelectedRoom={setSelectedRoom} rooms={displayedRooms} />
			</Col>
			<Col xs={12} md={6} className="px-0">
				<Tabs defaultActiveKey="join" justify>
					<Tab eventKey="join" title="Join room">
						<RoomDetail selectedRoom={selectedRoom} />
					</Tab>
					<Tab eventKey="create" title="Create room">
						<RoomCreation />
					</Tab>
				</Tabs>
			</Col>
		</Row>
	);
}
