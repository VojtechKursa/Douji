"use client";

import { useEffect, useState } from "react";
import { VideoRoomSignalRClient } from "../lib/SignalR/VideoRoomSignalRClient";
import { YouTubeVideoPlayer } from "../lib/Player/Players/YouTubeVideoPlayer";
import { doujiPlayerStateToString } from "../lib/Player/PlayerStates/Generic/DoujiPlayerState";

const videoPlayerId = "player";
let videoPlayer: YouTubeVideoPlayer | undefined = undefined;

export function VideoPlayer({ client }: { client: VideoRoomSignalRClient | undefined }) {
	const [currentlyPlayedUrl, setCurrentlyPlayedUrl] = useState<string>();

	useEffect(() => {
		if (client == undefined) return;

		videoPlayer = new YouTubeVideoPlayer(videoPlayerId);

		videoPlayer.onStateUpdate((state) => {
			console.log(
				`Player onStateUpdate handler: ${
					state.external ? "external" : "INTERNAL"
				} state changed event to state ${doujiPlayerStateToString(state.state)} at video time ${
					state.videoTime == null ? "null" : Math.round(state.videoTime * 100) / 100
				}`
			);

			client.acceptPlayerEvent(state);
		});

		if (client == undefined) return;

		client.onWelcome(async (data) => {
			console.log(`Received welcome message`, data);
			if (data.currentlyPlayedURL != null) {
				await videoPlayer?.loadVideoByUrl(data.currentlyPlayedURL, true);
			}
		});

		client.onPlayVideo(async (_, url) => {
			console.log(`Received PlayVideo message: ${url}`);
			setCurrentlyPlayedUrl(url);

			await videoPlayer?.loadVideoByUrl(url, true);
		});

		client.onClientStateUpdate((newState) => {
			console.log("Received ClientStateUpdate message", newState);

			//await videoPlayer?.setState(videoPlayer.buildState(state, time, true, new Date(date)));
		});
	}, [client]);

	return (
		<div>
			<div>Currently played URL: {currentlyPlayedUrl}</div>
			<div id={videoPlayerId}></div>
		</div>
	);
}
