import { DoujiVideoPlayer } from "./Player/Players/DoujiVideoPlayer";
import { DoujiPlayerStateEnum, doujiPlayerStateToString } from "./Player/PlayerStates/Generic/DoujiPlayerState";
import { ClientStateWaiting } from "./SignalR/ClientStates/ClientState";
import { RoomStateEnum } from "./SignalR/RoomStates/RoomState";
import { VideoRoomSignalRClient } from "./SignalR/VideoRoomSignalRClient";

export class PlayerController {
	private readonly allowedPlayingDifferenceSeconds: number = 1;
	private readonly allowedPausedDifferenceSeconds: number = 0.1;
	private readonly bufferedTimeThresholdSeconds: number = 1;

	private ignoreNextState: DoujiPlayerStateEnum | null = null;

	public constructor(public readonly videoPlayer: DoujiVideoPlayer, public readonly client: VideoRoomSignalRClient) {
		videoPlayer.onStateUpdate(async (state) => {
			console.log(
				`Player onStateUpdate handler: state changed event to state ${doujiPlayerStateToString(
					state.state
				)} at video time ${state.videoTime == null ? "null" : Math.round(state.videoTime * 100) / 100}`
			);

			if (this.ignoreNextState != null) {
				if (state.state != this.ignoreNextState) {
					console.warn(
						`${doujiPlayerStateToString(
							this.ignoreNextState
						)} event expected, but arrived event is ${doujiPlayerStateToString(state.state)}.`
					);
				}
				this.ignoreNextState = null;
				return;
			}

			const roomState = client.getRoomState();

			if (state.state == DoujiPlayerStateEnum.Playing && roomState.state == RoomStateEnum.Waiting) {
				this.ignoreNextState = DoujiPlayerStateEnum.Paused;
				await videoPlayer.pause();

				const videoTime = await this.videoPlayer.getCurrentVideoTime();
				if (videoTime == undefined) {
					throw new Error("Video time undefined in playing state update.");
				}

				await client.setClientState(new ClientStateWaiting(videoTime, new Date()));
			} else {
				await client.acceptPlayerEvent(state);
			}
		});

		client.onRoomStateUpdate(async (state) => {
			switch (state.state) {
				case RoomStateEnum.Ended:
					await this.videoPlayer.setTime(Number.MAX_SAFE_INTEGER);
					break;
				case RoomStateEnum.Playing:
				case RoomStateEnum.Paused: {
					const expectedTime = state.getCurrentExpectedTime();
					if (expectedTime == null) {
						throw new Error(
							`Video time undefined in ${
								state.state == RoomStateEnum.Playing ? "playing" : "paused"
							} state change`
						);
					}

					const playerState = this.videoPlayer.getState();
					let setState: boolean = false;
					let setTime: boolean = false;

					if (
						(state.state == RoomStateEnum.Playing && playerState.state != DoujiPlayerStateEnum.Playing) ||
						(state.state == RoomStateEnum.Paused && playerState.state != DoujiPlayerStateEnum.Paused)
					) {
						setState = true;
					}

					const videoTime = await this.videoPlayer.getCurrentVideoTime();
					if (
						videoTime == undefined ||
						Math.abs(videoTime - expectedTime) >
							(state.state == RoomStateEnum.Playing
								? this.allowedPlayingDifferenceSeconds
								: this.allowedPausedDifferenceSeconds)
					) {
						setTime = true;
					}

					if (setState) {
						if (state.state == RoomStateEnum.Playing) {
							await this.videoPlayer.play();
						} else if (state.state == RoomStateEnum.Paused) {
							await this.videoPlayer.pause();
						}
					}

					if (setTime) {
						await this.videoPlayer.setTime(expectedTime);
					}

					break;
				}
				case RoomStateEnum.Waiting: {
					if (state.videoTime == null) {
						throw new Error("Video time undefined in waiting state change");
					}
					const videoState = this.videoPlayer.getState();
					if (videoState.state == DoujiPlayerStateEnum.Unstarted) {
						await this.videoPlayer.play();
					}

					let [duration, buffered, videoTime] = await Promise.all([
						this.videoPlayer.getDuration(),
						this.videoPlayer.getBufferedTime(),
						this.videoPlayer.getCurrentVideoTime(),
					]);
					duration ??= 0;
					buffered ??= 0;
					videoTime ??= videoState.state == DoujiPlayerStateEnum.Ended ? duration : 0;

					if (
						buffered >= this.bufferedTimeThresholdSeconds ||
						(duration <= this.bufferedTimeThresholdSeconds && buffered >= duration)
					) {
						this.ignoreNextState = DoujiPlayerStateEnum.Paused;
						await this.videoPlayer.pause();
						await this.videoPlayer.setTime(state.videoTime);
						await this.client.setClientState(new ClientStateWaiting(state.videoTime, new Date()));
					}
					break;
				}
				default:
					break;
			}
		});
	}
}
