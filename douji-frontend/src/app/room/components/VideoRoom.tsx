"use client";

import { useEffect, useState } from "react";
import { ClientList } from "./ClientList";
import { VideoPlayer } from "./VideoPlayer";
import { VideoRoomSignalRClient } from "../lib/SignalR/VideoRoomSignalRClient";
import { VideoUrlField } from "./VideoUrlField";
import { ConnectionParameters } from "@/app/lib/ConnectionParameters";

function getQueryRoomId(query?: string | URLSearchParams): number | null {
	const searchParams: URLSearchParams =
		query == undefined
			? new URLSearchParams(window.location.search)
			: typeof query === "string"
			? new URLSearchParams(query)
			: query;

	const queryRoomIdStr = searchParams.get("roomId");
	if (queryRoomIdStr === null) return null;

	const roomId = Number.parseInt(queryRoomIdStr);
	if (Number.isNaN(roomId)) return null;

	return roomId;
}

export function VideoRoom() {
	const [signalRClient, setSignalRClient] = useState<VideoRoomSignalRClient>();

	useEffect(() => {
		const queryRoomId = getQueryRoomId();
		const params = ConnectionParameters.load();

		if (
			params == undefined ||
			Date.now() - params.dateCreatedUnix > 10000 ||
			queryRoomId == undefined ||
			queryRoomId != params.roomId
		) {
			window.location.href = "/";
			return;
		}

		const videoRoomClient = new VideoRoomSignalRClient(params.roomId, params.username, params.password);
		setSignalRClient(videoRoomClient);

		videoRoomClient.onForcedDisconnect((reason: string | undefined) => {
			const reasonText: string = reason == undefined ? "No reason given." : `Reason: ${reason}`;
			alert(`Server closed connection. ${reasonText}`);
		});
		videoRoomClient.onClose(() => (window.location.href = "/"));

		videoRoomClient.connect();

		function beforeHideHandler() {
			videoRoomClient.disconnect();
		}

		window.addEventListener("pagehide", beforeHideHandler);

		return () => {
			window.removeEventListener("pagehide", beforeHideHandler);
		};
	}, []);

	return (
		<div>
			<VideoPlayer client={signalRClient} />
			<ClientList client={signalRClient} />
			<VideoUrlField client={signalRClient} />
		</div>
	);
}
