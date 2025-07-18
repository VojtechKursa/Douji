"use client";

import { useEffect, useState } from "react";
import { PlayerController } from "../lib/PlayerController";

const playerElementId = "player";

export function VideoPlayer({
	controller,
	videoPlayerElementId,
	setVideoPlayerElementId,
}: {
	controller: PlayerController | undefined;
	videoPlayerElementId: string | undefined;
	setVideoPlayerElementId: (value: string) => void;
}) {
	const [currentlyPlayedUrl, setCurrentlyPlayedUrl] = useState<string>();

	useEffect(() => {
		if (videoPlayerElementId == undefined || videoPlayerElementId != playerElementId) {
			setVideoPlayerElementId(playerElementId);
			return;
		}

		if (controller == undefined) return;

		const client = controller.client;

		client.onWelcome(async (data) => {
			if (data.currentlyPlayedURL != null) {
				setCurrentlyPlayedUrl(data.currentlyPlayedURL);
			}
		});

		client.onPlayVideo(async (_, url) => {
			console.log(`Received PlayVideo message: ${url}`);
			setCurrentlyPlayedUrl(url);
		});
	}, [controller, videoPlayerElementId, setVideoPlayerElementId]);

	return (
		<div>
			<div>Currently played URL: {currentlyPlayedUrl}</div>
			<div id={playerElementId}></div>
		</div>
	);
}
