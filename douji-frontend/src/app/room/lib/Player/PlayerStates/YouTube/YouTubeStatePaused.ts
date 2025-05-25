import PlayerStates from "youtube-player/dist/constants/PlayerStates";
import { youTubeStateToString } from "../../Players/YouTubeVideoPlayer";
import { DoujiVideoPlayer } from "../../Players/DoujiVideoPlayer";
import { DoujiPlayerState, DoujiPlayerStatePaused } from "../Generic/DoujiPlayerState";
import { YouTubeStateEnded } from "./YouTubeStateEnded";
import { YouTubeStatePlaying } from "./YouTubeStatePlaying";
import { YouTubeStateBuffering } from "./YouTubeStateBuffering";

export class YouTubeStatePaused extends DoujiPlayerStatePaused<PlayerStates> {
	private readonly playingTransitionTimeLimitMs: number = 750;
	private playingTransitionTimerId: number | NodeJS.Timeout | null = null;

	public override async acceptEvent(
		state: PlayerStates,
		player: DoujiVideoPlayer<PlayerStates>
	): Promise<DoujiPlayerState<PlayerStates> | null> {
		const time = await player.getCurrentTime();

		switch (state) {
			case PlayerStates.ENDED:
				return new YouTubeStateEnded(false, new Date());
			case PlayerStates.BUFFERING:
				// Wait for BUFFERING -> PLAYING transition or announce BUFFERING when it takes too long

				this.playingTransitionTimerId = setTimeout(() => {
					player.changeState(
						new YouTubeStateBuffering(
							time ?? 0,
							false,
							new Date(Date.now() - this.playingTransitionTimeLimitMs),
							player
						)
					);
				}, this.playingTransitionTimeLimitMs);

				return null;
			case PlayerStates.PLAYING:
			case PlayerStates.PAUSED:
				// PLAYING: When BUFFERING -> PLAYING transition arrives
				// PAUSED: When waiting for BUFFERING -> PLAYING transition and player gets paused again

				this.destroy();

				if (state == PlayerStates.PLAYING) {
					return new YouTubeStatePlaying(time ?? 0, false, new Date());
				} else {
					return new YouTubeStatePaused(time ?? 0, false, new Date(), player);
				}
			default:
				console.log(
					`Unexpected state transition from state PAUSED to ${youTubeStateToString(state)}. Ignoring it.`
				);
				return null;
		}
	}

	public override destroy(): void {
		super.destroy();

		if (this.playingTransitionTimerId != null) {
			clearTimeout(this.playingTransitionTimerId);
			this.playingTransitionTimerId = null;
		}
	}

	protected override buildUpdatedState(
		time: number,
		external: boolean,
		updatedAt: Date,
		player: DoujiVideoPlayer<PlayerStates>
	): YouTubeStatePaused {
		return new YouTubeStatePaused(time, external, updatedAt, player);
	}
}
