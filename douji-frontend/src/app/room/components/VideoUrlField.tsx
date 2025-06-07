"use client";

import { useEffect, useState } from "react";
import { VideoRoomSignalRClient } from "../lib/SignalR/VideoRoomSignalRClient";

export function VideoUrlField({ client }: { client: VideoRoomSignalRClient | undefined }) {
	const [url, setUrl] = useState<string>("");

	useEffect(() => {
		client?.onWelcome((data) => {
			if (data.currentlyPlayedURL != null) {
				setUrl(data.currentlyPlayedURL);
			}
		});
	}, [client]);

	function handleClick() {
		if (url.length > 0 && client != undefined) {
			client.playVideo(url);
			setUrl("");
		}
	}

	return (
		<div>
			<input type="text" value={url} onChange={(e) => setUrl(e.target.value)}></input>
			<button type="button" onClick={handleClick} disabled={url.length <= 0 || client == undefined}>
				Play
			</button>
		</div>
	);
}
