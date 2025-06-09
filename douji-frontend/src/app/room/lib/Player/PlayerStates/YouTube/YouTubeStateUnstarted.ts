import PlayerStates from "youtube-player/dist/constants/PlayerStates";
import { youTubeStateToString } from "../../Players/YouTubeVideoPlayer";
import { DoujiPlayerState, DoujiPlayerStateUnstarted } from "../Generic/DoujiPlayerState";
import { YouTubeStateBuffering } from "./YouTubeStateBuffering";
import { DoujiVideoPlayerTyped } from "../../Players/DoujiVideoPlayer";
import { YouTubeStateEnded } from "./YouTubeStateEnded";

export class YouTubeStateUnstarted extends DoujiPlayerStateUnstarted<PlayerStates> {
	public override async acceptEvent(
		state: PlayerStates,
		player: DoujiVideoPlayerTyped<PlayerStates>
	): Promise<DoujiPlayerState<PlayerStates> | null> {
		switch (state) {
			case PlayerStates.VIDEO_CUED:
			case PlayerStates.UNSTARTED:
				return null;
			case PlayerStates.BUFFERING:
				return new YouTubeStateBuffering((await player.getCurrentVideoTime()) ?? 0, false, new Date(), player);
			case PlayerStates.ENDED:
				return new YouTubeStateEnded(false, new Date());
			default:
				console.log(
					`Unexpected state transition from state UNSTARTED to ${youTubeStateToString(state)}. Ignoring it.`
				);
				return null;
		}
	}
}
