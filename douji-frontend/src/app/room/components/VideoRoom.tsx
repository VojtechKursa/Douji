"use client";

import { useEffect, useState } from "react";
import { ClientList } from "./ClientList";
import { VideoPlayer } from "./VideoPlayer";
import { VideoRoomSignalRClient } from "../lib/SignalR/VideoRoomSignalRClient";
import { VideoUrlField } from "./VideoUrlField";
import { ConnectionParameters } from "@/app/lib/ConnectionParameters";
import { PlayerController } from "../lib/PlayerController";
import { YouTubeVideoPlayer } from "../lib/Player/Players/YouTubeVideoPlayer";

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
	const [playerController, setPlayerController] = useState<PlayerController>();
	const [videoPlayerElementId, setVideoPlayerElementId] = useState<string>();

	useEffect(() => {
		const queryRoomId = getQueryRoomId();
		const params = ConnectionParameters.load();

		if (params == undefined || queryRoomId == undefined || queryRoomId != params.roomId) {
			window.location.href = "/";
			return;
		}
	}, []);

	useEffect(() => {
		const params = ConnectionParameters.load();
		if (params == undefined) {
			window.location.href = "/";
			return;
		}

		if (videoPlayerElementId == undefined) return;

		const videoPlayer = new YouTubeVideoPlayer(videoPlayerElementId);
		const videoRoomClient = new VideoRoomSignalRClient(params.roomId, params.reservationId, params.username);
		setPlayerController(new PlayerController(videoPlayer, videoRoomClient));

		videoRoomClient.onForcedDisconnect((reason: string | undefined) => {
			const reasonText: string = reason == undefined ? "No reason given." : `Reason: ${reason}`;
			alert(`Server closed connection. ${reasonText}`);
		});
		videoRoomClient.onClose(() => (window.location.href = "/"));
		videoRoomClient.onRejected(() => (window.location.href = "/"));

		videoRoomClient.connect();

		function beforeHideHandler() {
			videoRoomClient.disconnect();
		}

		window.addEventListener("pagehide", beforeHideHandler);

		return () => {
			window.removeEventListener("pagehide", beforeHideHandler);
		};
	}, [videoPlayerElementId]);

	return (
		<div className="d-flex flex-column flex-md-row">
			<div className="w-100 flex-md-grow-1">
				<div>
					<VideoPlayer
						controller={playerController}
						videoPlayerElementId={videoPlayerElementId}
						setVideoPlayerElementId={setVideoPlayerElementId}
					/>
				</div>
				<div>
					<VideoUrlField client={playerController?.client} />
				</div>
			</div>
			<div className="ps-md-3">
				<ClientList client={playerController?.client} />
			</div>
		</div>
	);
}
