import PlayerStates from "youtube-player/dist/constants/PlayerStates";
import { youTubeStateToString } from "../../Players/YouTubeVideoPlayer";
import { DoujiPlayerState, DoujiPlayerStateBuffering } from "../Generic/DoujiPlayerState";
import { DoujiVideoPlayerTyped } from "../../Players/DoujiVideoPlayer";
import { YouTubeStatePaused } from "./YouTubeStatePaused";
import { YouTubeStateEnded } from "./YouTubeStateEnded";
import { YouTubeStatePlaying } from "./YouTubeStatePlaying";
import { TimeProvider } from "@/app/lib/TimeProvider";
import { YouTubeStateUnstarted } from "./YouTubeStateUnstarted";

export class YouTubeStateBuffering extends DoujiPlayerStateBuffering<PlayerStates> {
	private unstartedTransitionFilterTimeoutId: number | NodeJS.Timeout | null = null;

	public override async acceptEvent(
		state: PlayerStates,
		player: DoujiVideoPlayerTyped<PlayerStates>
	): Promise<DoujiPlayerState<PlayerStates> | null> {
		if (this.unstartedTransitionFilterTimeoutId != null) {
			clearTimeout(this.unstartedTransitionFilterTimeoutId);
			this.unstartedTransitionFilterTimeoutId = null;
		}

		switch (state) {
			case PlayerStates.PAUSED:
			case PlayerStates.PLAYING:
				const videoTime = await player.getCurrentVideoTime();
				if (state == PlayerStates.PAUSED) {
					return new YouTubeStatePaused(videoTime ?? 0, TimeProvider.getTime(), player);
				} else {
					return new YouTubeStatePlaying(videoTime ?? 0, TimeProvider.getTime());
				}
			case PlayerStates.ENDED:
				return new YouTubeStateEnded(TimeProvider.getTime());
			case PlayerStates.UNSTARTED:
				// Buffering -> Unstarted can happen during initial load right before transition to Playing
				console.log("BUFFERING -> UNSTARTED transition caught");

				this.unstartedTransitionFilterTimeoutId = setTimeout(
					() => player.setState(new YouTubeStateUnstarted(TimeProvider.getTime())),
					1000
				);

				return null;
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
