"use client";

import { useState } from "react";
import { VideoRoomSignalRClient } from "../lib/SignalR/VideoRoomSignalRClient";

export function VideoUrlField({
	client,
}: {
	client: VideoRoomSignalRClient | undefined;
}) {
	const [url, setUrl] = useState<string>("");

	function handleClick() {
		if (url.length > 0 && client != undefined) {
			client.play(url);
			setUrl("");
		}
	}

	return (
		<div>
			<input
				type="text"
				value={url}
				onChange={(e) => setUrl(e.target.value)}
			></input>
			<button
				type="button"
				onClick={handleClick}
				disabled={url.length <= 0 || client == undefined}
			>
				Play
			</button>
		</div>
	);
}
