"use client";

import { useEffect, useState } from "react";
import { VideoRoomSignalRClient } from "../lib/SignalR/VideoRoomSignalRClient";
import { UserState } from "../lib/SignalR/Types/UserState";
import { ClientStateUnstarted } from "../lib/SignalR/ClientStates/ClientState";
import { TimeProvider } from "@/app/lib/TimeProvider";

export function ClientListEntry({ userState }: { userState: UserState }) {
	let stateString = "";
	if (userState.state != undefined) {
		stateString = ` - ${userState.state.state} (${
			userState.state.videoTime
		} at ${userState.state.updatedAt.toString()})`;
	}

	return (
		<li>
			{userState.user.name}
			{stateString}
		</li>
	);
}

function userCompare(a: UserState, b: UserState): number {
	return a.user.name.localeCompare(b.user.name);
}

export function ClientList({ client }: { client: VideoRoomSignalRClient | undefined }) {
	const [users, setUsers] = useState<UserState[]>([]);

	useEffect(() => {
		if (client == undefined) return;

		client.onWelcome((initialData) => setUsers(initialData.userStates.sort(userCompare)));

		client.onUserJoined((user) =>
			setUsers((users) =>
				[...users, new UserState(user, new ClientStateUnstarted(TimeProvider.getTime()))].sort(userCompare)
			)
		);

		client.onUserLeft((user) =>
			setUsers((users) => {
				const index = users.findIndex((userState) => userState.user.name == user.name);
				if (index < 0) return users;
				const usersCopy = users.slice();
				usersCopy.splice(index, 1);
				return usersCopy;
			})
		);

		client.onUserStateUpdate((userState) => {
			console.log("Received Client state update", userState);

			setUsers((users) => {
				const index = users.findIndex((user) => user.user.name == userState.user.name);
				if (index < 0) return users;
				const newUsers = users.slice();
				newUsers[index] = userState;
				return newUsers;
			});
		});
	}, [client]);

	return (
		<ul>
			{users.map((user, index) => (
				<ClientListEntry key={index} userState={user} />
			))}
		</ul>
	);
}
