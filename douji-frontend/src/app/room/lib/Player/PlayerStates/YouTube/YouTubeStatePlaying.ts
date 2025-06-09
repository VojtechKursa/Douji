import PlayerStates from "youtube-player/dist/constants/PlayerStates";
import { youTubeStateToString } from "../../Players/YouTubeVideoPlayer";
import { DoujiPlayerState, DoujiPlayerStatePlaying } from "../Generic/DoujiPlayerState";
import { DoujiVideoPlayerTyped } from "../../Players/DoujiVideoPlayer";
import { YouTubeStateEnded } from "./YouTubeStateEnded";
import { YouTubeStatePaused } from "./YouTubeStatePaused";
import { YouTubeStateBuffering } from "./YouTubeStateBuffering";

export class YouTubeStatePlaying extends DoujiPlayerStatePlaying<PlayerStates> {
	private readonly pauseTimeoutMs: number = 250;
	private readonly bufferingTimeoutMs: number = 750;
	private readonly bufferThresholdSeconds: number = 0.5;

	private transitionTimerId: number | NodeJS.Timeout | null = null;
	private inPauseTransition: boolean = false;
	private inBufferingTransition: boolean = false;

	public override async acceptEvent(
		state: PlayerStates,
		player: DoujiVideoPlayerTyped<PlayerStates>
	): Promise<DoujiPlayerState<PlayerStates> | null> {
		switch (state) {
			case PlayerStates.ENDED:
				return new YouTubeStateEnded(false, new Date());

			case PlayerStates.BUFFERING:
				if (this.inPauseTransition) {
					// Seeking with click

					this.inPauseTransition = false;
					this.destroyLocalTimer();
				}
				const videoTime = await player.getCurrentVideoTime();

				if (((await player.getBufferedTime()) ?? 0) < this.bufferThresholdSeconds) {
					return new YouTubeStateBuffering(videoTime ?? 0, false, new Date(), player);
				} else {
					this.inBufferingTransition = true;
					const timerStart = new Date();

					setTimeout(() => {
						if (!this.inBufferingTransition) return;
						player.changeState(new YouTubeStateBuffering(videoTime ?? 0, false, timerStart, player));
					}, this.bufferingTimeoutMs);

					return null;
				}

			case PlayerStates.PAUSED:
				if (this.inBufferingTransition) {
					// Paused while buffering

					this.inBufferingTransition = false;
					this.destroyLocalTimer();

					return new YouTubeStatePaused((await player.getCurrentVideoTime()) ?? 0, false, new Date(), player);
				} else {
					this.inPauseTransition = true;
					const timerStart = new Date();

					setTimeout(async () => {
						if (!this.inPauseTransition) return;
						player.changeState(
							new YouTubeStatePaused((await player.getCurrentVideoTime()) ?? 0, false, timerStart, player)
						);
					}, this.pauseTimeoutMs);

					return null;
				}

			case PlayerStates.PLAYING:
				if (this.inPauseTransition) {
					// Quick transition to playing after PAUSED

					this.inPauseTransition = false;
					this.destroyLocalTimer();
				}

				if (this.inBufferingTransition) {
					// Seek to a buffered part or quick buffering

					this.inBufferingTransition = false;
					this.destroyLocalTimer();
				}

				return new YouTubeStatePlaying((await player.getCurrentVideoTime()) ?? 0, false, new Date());

			default:
				console.log(
					`Unexpected state transition from state PLAYING to ${youTubeStateToString(state)}. Ignoring it.`
				);
				return null;
		}
	}

	public override destroy(): void {
		super.destroy();

		this.destroyLocalTimer();
	}

	protected destroyLocalTimer(): void {
		if (this.transitionTimerId != null) {
			clearTimeout(this.transitionTimerId);
			this.transitionTimerId = null;
		}
	}
}
