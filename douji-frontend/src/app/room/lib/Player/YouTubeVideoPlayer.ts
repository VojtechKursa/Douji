import ClientConfig from "@/app/lib/ClientConfig";
import YTPlayer from "youtube-player";
import { YouTubePlayer } from "youtube-player/dist/types";

enum YouTubePlayerState {
	StartNewVideo = -1,
	VideoEnded = 0,
	Play = 1,
	Pause = 2,
	Buffer = 3,
}

function stateToString(state: YouTubePlayerState): string {
	switch (state) {
		case YouTubePlayerState.Buffer: return "Buffer";
		case YouTubePlayerState.Pause: return "Pause";
		case YouTubePlayerState.Play: return "Play";
		case YouTubePlayerState.StartNewVideo: return "StartNewVideo";
		case YouTubePlayerState.VideoEnded: return "VideoEnded";
	}
}

export class YouTubeVideoPlayer {
	public readonly player: YouTubePlayer
	public constructor(elementId: string) {
		this.player = YTPlayer(elementId);

		this.player.on("ready", () => {
			if (ClientConfig.devBuild) {
				this.player.on("stateChange", (ev) => {
					const state = ev.data as YouTubePlayerState;
					console.log(`State change. State: ${state} (${stateToString(state)})`);
				});
			}
		});
	}

	public async playVideoById(id: string): Promise<void> {
		await this.player.loadVideoById(id, 0);
		await this.player.mute();
		await this.player.playVideo();
	}
}
