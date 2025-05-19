"use client";

import { useEffect, useState } from "react";
import { VideoRoomSignalRClient } from "../lib/SignalR/VideoRoomSignalRClient";
import { YouTubeVideoPlayer } from "../lib/Player/YouTubeVideoPlayer";

const videoPlayerId = "player";
let videoPlayer: YouTubeVideoPlayer | undefined = undefined;

export function VideoPlayer({
	client,
}: {
	client: VideoRoomSignalRClient | undefined;
}) {
	const [currentlyPlayedUrl, setCurrentlyPlayedUrl] = useState<string>();

	useEffect(() => {
		if (client == undefined) return;

		videoPlayer = new YouTubeVideoPlayer(videoPlayerId);

		client.onMethod("PlayVideo", (_, url) => {
			setCurrentlyPlayedUrl(url);

			const idMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube|yt)\.com\/watch\?v=([\w\d]+)/i);
			if (idMatch == null)
				return;
			const id = idMatch[1];

			videoPlayer?.playVideoById(id);
		});
	}, [client]);

	return (
		<div>
			<div>Currently played URL: {currentlyPlayedUrl}</div>
			<div id={videoPlayerId}></div>
		</div>
	);
}
