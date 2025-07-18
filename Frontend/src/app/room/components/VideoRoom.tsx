"use client";

import { useEffect, useState } from "react";
import { ClientList } from "./ClientList";
import { VideoPlayer } from "./VideoPlayer";
import { VideoRoomSignalRClient } from "../lib/SignalR/VideoRoomSignalRClient";
import { VideoUrlField } from "./VideoUrlField";
import { ConnectionParameters } from "@/app/lib/ConnectionParameters";
import { PlayerController } from "../lib/PlayerController";
import { YouTubeVideoPlayer } from "../lib/Player/Players/YouTubeVideoPlayer";
import { Service, ServicesResolver } from "@/app/lib/ServicesResolver";

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
	const [connectionParameters, setConnectionParameters] = useState<ConnectionParameters>();

	const [backendUrl, setBackendUrl] = useState<string>();
	const [videoPlayerElementId, setVideoPlayerElementId] = useState<string>();

	const [playerController, setPlayerController] = useState<PlayerController>();
	const [videoPlayer, setVideoPlayer] = useState<YouTubeVideoPlayer>();
	const [signalRClient, setSignalRClient] = useState<VideoRoomSignalRClient>();

	useEffect(() => {
		const queryRoomId = getQueryRoomId();
		const params = ConnectionParameters.load();

		if (params == undefined || queryRoomId == undefined || queryRoomId != params.roomId) {
			window.location.href = "/";
			return;
		}

		setConnectionParameters(params);
	}, []);

	useEffect(() => {
		ServicesResolver.instance.getService(Service.Backend).then((result) => setBackendUrl(result));
	}, []);

	useEffect(() => {
		if (videoPlayerElementId == undefined) return;

		const videoPlayer = new YouTubeVideoPlayer(videoPlayerElementId);
		setVideoPlayer(videoPlayer);
	}, [videoPlayerElementId]);

	useEffect(() => {
		if (backendUrl == undefined || connectionParameters == undefined) return;

		const videoRoomClient = new VideoRoomSignalRClient(
			backendUrl,
			connectionParameters.roomId,
			connectionParameters.reservationId,
			connectionParameters.username
		);

		setSignalRClient(videoRoomClient);
	}, [backendUrl, connectionParameters]);

	useEffect(() => {
		if (videoPlayer == undefined || signalRClient == undefined) return;

		setPlayerController(new PlayerController(videoPlayer, signalRClient));

		signalRClient.onForcedDisconnect((reason: string | undefined) => {
			const reasonText: string = reason == undefined ? "No reason given." : `Reason: ${reason}`;
			alert(`Server closed connection. ${reasonText}`);
		});
		signalRClient.onClose(() => (window.location.href = "/"));
		signalRClient.onRejected(() => (window.location.href = "/"));

		signalRClient.connect();

		function beforeHideHandler() {
			if (signalRClient != undefined) signalRClient.disconnect();
		}

		window.addEventListener("pagehide", beforeHideHandler);

		return () => {
			window.removeEventListener("pagehide", beforeHideHandler);
		};
	}, [videoPlayer, signalRClient]);

	return (
		<div className="d-flex flex-column flex-lg-row">
			<div className="w-100 flex-lg-grow-1">
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
			<div className="ps-lg-3">
				<ClientList client={playerController?.client} />
			</div>
		</div>
	);
}
