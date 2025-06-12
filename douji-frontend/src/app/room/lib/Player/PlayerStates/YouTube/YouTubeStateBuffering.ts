import PlayerStates from "youtube-player/dist/constants/PlayerStates";
import { youTubeStateToString } from "../../Players/YouTubeVideoPlayer";
import { DoujiPlayerState, DoujiPlayerStateBuffering } from "../Generic/DoujiPlayerState";
import { DoujiVideoPlayerTyped } from "../../Players/DoujiVideoPlayer";
import { YouTubeStatePaused } from "./YouTubeStatePaused";
import { YouTubeStateEnded } from "./YouTubeStateEnded";
import { YouTubeStatePlaying } from "./YouTubeStatePlaying";

export class YouTubeStateBuffering extends DoujiPlayerStateBuffering<PlayerStates> {
	public override async acceptEvent(
		state: PlayerStates,
		player: DoujiVideoPlayerTyped<PlayerStates>
	): Promise<DoujiPlayerState<PlayerStates> | null> {
		switch (state) {
			case PlayerStates.PAUSED:
			case PlayerStates.PLAYING:
				const videoTime = await player.getCurrentVideoTime();
				if (state == PlayerStates.PAUSED) {
					return new YouTubeStatePaused(videoTime ?? 0, new Date(), player);
				} else {
					return new YouTubeStatePlaying(videoTime ?? 0, new Date());
				}
			case PlayerStates.ENDED:
				return new YouTubeStateEnded(new Date());
			default:
				console.log(
					`Unexpected state transition from state BUFFERING to ${youTubeStateToString(state)}. Ignoring it.`
				);
				return null;
		}
	}

	protected override buildUpdatedState(
		videoTime: number,
		updatedAt: Date,
		player: DoujiVideoPlayerTyped<PlayerStates>
	): YouTubeStateBuffering {
		return new YouTubeStateBuffering(videoTime, updatedAt, player);
	}
}
