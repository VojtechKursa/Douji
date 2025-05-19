"use client";

import { useEffect, useState } from "react";
import { VideoRoomSignalRClient } from "../lib/SignalR/VideoRoomSignalRClient";

export function ClientListEntry({ name }: { name: string }) {
	return <li>{name}</li>;
}

export function ClientList({
	client,
}: {
	client: VideoRoomSignalRClient | undefined;
}) {
	const [users, setUsers] = useState<string[]>([]);

	useEffect(() => {
		if (client == undefined) return;

		client.onMethod("Welcome", (initialData) =>
			setUsers(initialData.users.map((user) => user.name).sort())
		);

		client.onMethod("UserJoined", (user) =>
			setUsers((users) => [...users, user.name].sort())
		);

		client.onMethod("UserLeft", (user) =>
			setUsers((users) => {
				const index = users.findIndex((name) => name == user.name);
				if (index < 0) return users;
				const usersCopy = users.slice();
				usersCopy.splice(index, 1);
				return usersCopy.sort();
			})
		);
	}, [client]);

	return (
		<ul>
			{users.map((user, index) => (
				<ClientListEntry key={index} name={user} />
			))}
		</ul>
	);
}
