import PlayerStates from "youtube-player/dist/constants/PlayerStates";
import { youTubeStateToString } from "../../Players/YouTubeVideoPlayer";
import { DoujiPlayerState, DoujiPlayerStateEnded } from "../Generic/DoujiPlayerState";
import { DoujiVideoPlayerTyped } from "../../Players/DoujiVideoPlayer";
import { YouTubeStateBuffering } from "./YouTubeStateBuffering";

export class YouTubeStateEnded extends DoujiPlayerStateEnded<PlayerStates> {
	private readonly capturedStates: PlayerStates[] = [];

	public override async acceptEvent(
		state: PlayerStates,
		player: DoujiVideoPlayerTyped<PlayerStates>
	): Promise<DoujiPlayerState<PlayerStates> | null> {
		switch (state) {
			case PlayerStates.PLAYING:
			case PlayerStates.PAUSED:
				this.capturedStates.push(state);
				return null;
			case PlayerStates.BUFFERING:
				if (
					!(
						this.capturedStates.findIndex((x) => x == PlayerStates.PLAYING) == 0 &&
						(this.capturedStates.length == 1 ||
							(this.capturedStates.length == 2 &&
								this.capturedStates.findIndex((x) => x == PlayerStates.PAUSED) == 1))
					)
				) {
					console.log(
						`Detected unusual state change from ENDED to BUFFERING. Previously captured states: ${this.capturedStates
							.map((x) => youTubeStateToString(x))
							.join(", ")}.`
					);
				}

				const videoTime = await player.getCurrentVideoTime();
				return new YouTubeStateBuffering(videoTime ?? 0, new Date(), player);
			default:
				console.log(
					`Unexpected state transition from state ENDED to ${youTubeStateToString(state)}. Ignoring it.`
				);
				return null;
		}
	}
}
