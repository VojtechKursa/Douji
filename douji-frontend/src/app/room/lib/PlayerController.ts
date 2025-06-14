import { TimeProvider } from "@/app/lib/TimeProvider";
import { DoujiVideoPlayer } from "./Player/Players/DoujiVideoPlayer";
import {
	DoujiPlayerStateEnum,
	doujiPlayerStateToString,
	IDoujiPlayerState,
} from "./Player/PlayerStates/Generic/DoujiPlayerState";
import {
	ClientState,
	ClientStateBuffering,
	ClientStateEnded,
	ClientStatePaused,
	ClientStatePlaying,
	ClientStateUnstarted,
	ClientStateWaiting,
} from "./SignalR/ClientStates/ClientState";
import { RoomState, RoomStateEnum } from "./SignalR/RoomStates/RoomState";
import { VideoRoomSignalRClient } from "./SignalR/VideoRoomSignalRClient";
import { WelcomeData } from "./SignalR/Types/WelcomeData";
import { UnreachableError } from "@/app/lib/Errors/UnreachableError";

export class PlayerController {
	private readonly allowedPlayingDifferenceSeconds: number = 1;
	private readonly allowedPausedDifferenceSeconds: number = 0.1;
	private readonly bufferedTimeThresholdSeconds: number = 1;

	private readonly waitAnnounceDelayMs: number = 500;

	private synchronizing: boolean = true;
	private ignoreNextState: DoujiPlayerStateEnum | null = null;
	private welcomeData: WelcomeData | null = null;

	public constructor(public readonly videoPlayer: DoujiVideoPlayer, public readonly client: VideoRoomSignalRClient) {
		videoPlayer.onStateUpdate(async (state) => {
			console.log(`Player state changed to ${doujiPlayerStateToString(state.state)}`);

			if (this.ignoreNextState != null) {
				if (state.state != this.ignoreNextState) {
					console.warn(
						`${doujiPlayerStateToString(
							this.ignoreNextState
						)} event expected, but arrived event is ${doujiPlayerStateToString(state.state)}.`
					);
				} else {
					console.log(`Ignored state (${doujiPlayerStateToString(state.state)}) arrived.`);
				}
				this.ignoreNextState = null;
				return;
			}

			if (this.welcomeData == null) return;

			let roomState: RoomState;
			{
				const clientRoomState = client.getRoomState();
				if (clientRoomState.updatedAt.getTime() == 0) {
					roomState = this.welcomeData.roomState;
				} else {
					roomState = clientRoomState;
				}
			}

			if (this.synchronizing) {
				const clientState = await this.synchronizationStateUpdateHandle(state, roomState);

				if (this.synchronizing) {
					return;
				} else {
					if (clientState != null) {
						await this.client.setClientState(clientState);
						return;
					}
				}
			}

			if (state.state == DoujiPlayerStateEnum.Playing && roomState.state == RoomStateEnum.Waiting) {
				console.log("Playing state arrived while room is waiting, switching own state to waiting.");

				this.ignoreNextState = DoujiPlayerStateEnum.Paused;
				await videoPlayer.pause();

				const videoTime = await this.videoPlayer.getCurrentVideoTime();
				if (videoTime == undefined) {
					throw new Error("Video time undefined in playing state update.");
				}

				setTimeout(async () => {
					await this.client.setClientState(new ClientStateWaiting(videoTime, TimeProvider.getTime()));
				}, this.waitAnnounceDelayMs);
			} else {
				await this.client.acceptPlayerEvent(state);
			}
		});

		client.onRoomStateUpdate(async (state) => {
			console.log("Room state changed to", state);

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
						await this.client.setClientState(
							new ClientStateWaiting(state.videoTime, TimeProvider.getTime())
						);
					}
					break;
				}
				default:
					break;
			}
		});

		client.onWelcome(async (data) => {
			console.log(`Received welcome message`, data);
			this.welcomeData = data;

			TimeProvider.offsetMs = await client.requestServerTimeOffsetMs();
			console.log(`Time offset is ${TimeProvider.offsetMs} ms`);

			if (data.currentlyPlayedURL != null) {
				await videoPlayer.loadVideoByUrl(data.currentlyPlayedURL);
			} else {
				this.synchronizing = false;
			}
		});
	}

	/**
	 * This function updates {@link PlayerController.synchronizing} variable to indicate, whether the player is still synchronizing.
	 * If this function returns a not-null {@link ClientState}, it should be set to current state of the client and exit.
	 */
	private async synchronizationStateUpdateHandle(
		state: IDoujiPlayerState,
		roomState: RoomState
	): Promise<ClientState | null> {
		if (!this.synchronizing) return null;

		console.log("State is still synchronizing");

		switch (roomState.state) {
			case RoomStateEnum.Unstarted:
				this.synchronizing = false;
				break;
			case RoomStateEnum.Ended:
				if (state.state == DoujiPlayerStateEnum.Unstarted) {
					await this.videoPlayer.play();
				} else if (state.state == DoujiPlayerStateEnum.Ended) {
					this.synchronizing = false;
				} else {
					await this.videoPlayer.setTime(Number.MAX_SAFE_INTEGER);
				}
				break;
			case RoomStateEnum.Playing:
			case RoomStateEnum.Paused:
			case RoomStateEnum.Waiting:
				switch (state.state) {
					case DoujiPlayerStateEnum.Unstarted:
						await this.videoPlayer.play();
						break;
					case DoujiPlayerStateEnum.Ended:
						const expectedTime = roomState.getCurrentExpectedTime();
						if (expectedTime == null) throw new UnreachableError();
						await this.videoPlayer.setTime(expectedTime);
						break;
					case DoujiPlayerStateEnum.Buffering:
					case DoujiPlayerStateEnum.Paused:
					case DoujiPlayerStateEnum.Playing:
						if (roomState.state == RoomStateEnum.Paused && state.state != DoujiPlayerStateEnum.Paused) {
							await this.videoPlayer.pause();
						} else if (
							(roomState.state == RoomStateEnum.Playing || roomState.state == RoomStateEnum.Waiting) &&
							state.state != DoujiPlayerStateEnum.Playing &&
							state.state != DoujiPlayerStateEnum.Buffering
						) {
							await this.videoPlayer.play();
						} else {
							const currentTime = await this.videoPlayer.getCurrentVideoTime();
							const expectedTime = roomState.getCurrentExpectedTime();
							if (expectedTime == null || currentTime == undefined) throw new UnreachableError();

							if (
								Math.abs(currentTime - expectedTime) >
								(roomState.state == RoomStateEnum.Paused
									? this.allowedPausedDifferenceSeconds
									: this.allowedPlayingDifferenceSeconds)
							) {
								await this.videoPlayer.setTime(expectedTime);
							} else {
								this.synchronizing = false;
							}
						}
						break;
				}
				break;
		}

		if (!this.synchronizing) {
			console.log("Synchronization finished");
			const videoTime = await this.videoPlayer.getCurrentVideoTime();
			let clientState: ClientState | null = null;

			switch (state.state) {
				case DoujiPlayerStateEnum.Unstarted:
					clientState = new ClientStateUnstarted(TimeProvider.getTime());
					break;
				case DoujiPlayerStateEnum.Ended:
					clientState = new ClientStateEnded(TimeProvider.getTime());
					break;
				case DoujiPlayerStateEnum.Paused:
					if (videoTime == undefined) throw new UnreachableError();
					clientState = new ClientStatePaused(videoTime, TimeProvider.getTime());
					break;
				case DoujiPlayerStateEnum.Buffering:
					if (videoTime == undefined) throw new UnreachableError();
					clientState = new ClientStateBuffering(videoTime, TimeProvider.getTime());
					break;
				case DoujiPlayerStateEnum.Playing:
					if (videoTime == undefined) throw new UnreachableError();

					if (roomState.state == RoomStateEnum.Playing) {
						clientState = new ClientStatePlaying(videoTime, TimeProvider.getTime());
					}
					break;
			}

			return clientState;
		} else {
			return null;
		}
	}
}
