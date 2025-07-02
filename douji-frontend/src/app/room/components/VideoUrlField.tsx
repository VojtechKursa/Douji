"use client";

import { useEffect, useState } from "react";
import { VideoRoomSignalRClient } from "../lib/SignalR/VideoRoomSignalRClient";
import { Button, Form, FormControl, FormGroup, FormLabel, Stack } from "react-bootstrap";

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
		<Form>
			<Stack direction="horizontal" className="align-items-stretch">
				<FormGroup className="flex-grow-1">
					<FormLabel>Url to play</FormLabel>
					<FormControl type="text" value={url} onChange={(e) => setUrl(e.target.value)} />
				</FormGroup>
				<div className="ms-4">
					<Button className="h-100" onClick={handleClick} disabled={url.length <= 0 || client == undefined}>
						Play
					</Button>
				</div>
			</Stack>
		</Form>
	);
}
