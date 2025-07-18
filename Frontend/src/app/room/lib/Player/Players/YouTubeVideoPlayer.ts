import YTPlayer from "youtube-player";
import PlayerStates from "youtube-player/dist/constants/PlayerStates";
import {
	DoujiPlayerState,
	DoujiPlayerStateEnum,
	IDoujiPlayerState,
	InvalidStateError,
} from "../PlayerStates/Generic/DoujiPlayerState";
import {
	DoujiVideoPlayerTyped,
	PlayerStateUpdateHandler,
	PlayerStateUpdateHandlerTyped,
	VideoQuality,
} from "./DoujiVideoPlayer";
import { YouTubeStateUnstarted } from "../PlayerStates/YouTube/YouTubeStateUnstarted";
import { YouTubeStateEnded } from "../PlayerStates/YouTube/YouTubeStateEnded";
import { YouTubeStatePlaying } from "../PlayerStates/YouTube/YouTubeStatePlaying";
import { YouTubeStateBuffering } from "../PlayerStates/YouTube/YouTubeStateBuffering";
import { YouTubeStatePaused } from "../PlayerStates/YouTube/YouTubeStatePaused";
import { YouTubePlayer } from "youtube-player/dist/types";
import { TimeProvider } from "@/app/lib/TimeProvider";

enum RepeatableAction {
	Pause,
	Play,
}

function repeatableActionToString(action: RepeatableAction): string {
	switch (action) {
		case RepeatableAction.Pause:
			return "PAUSE";
		case RepeatableAction.Play:
			return "PLAY";
	}
}

export function youTubeStateToString(state: PlayerStates): string {
	switch (state) {
		case PlayerStates.UNSTARTED:
			return "UNSTARTED";
		case PlayerStates.ENDED:
			return "ENDED";
		case PlayerStates.PLAYING:
			return "PLAYING";
		case PlayerStates.PAUSED:
			return "PAUSED";
		case PlayerStates.BUFFERING:
			return "BUFFERING";
		case PlayerStates.VIDEO_CUED:
			return "CUED";
		default:
			return `UNKNOWN (${state})`;
	}
}

/*
	Retry handler for situations where play or pause are called right after the other method
	from that pair was called. In those cases, the player is still in the previous state
	so the message to transition back to the previous state is lost.
	(playing -> pause -> play -> paused state, play command is lost)
*/
class RepeatableYouTubeActionHandler {
	private timeoutId: number | NodeJS.Timeout | null = null;

	public constructor(
		public readonly player: YouTubeVideoPlayer,
		public readonly action: RepeatableAction,
		private attemptLimit: number = 1,
		private readonly attemptPeriodMs: number = 1000
	) {
		if (attemptLimit > 0) {
			this.timeoutId = this.createTimeout();
		} else {
			this.cleanUp();
		}
	}

	public get attemptingToRepeatAction(): boolean {
		return this.timeoutId != null;
	}

	private createTimeout(): number | NodeJS.Timeout {
		return setTimeout(async () => await this.handler(), this.attemptPeriodMs);
	}

	public notifyOfEvent(event: PlayerStates): boolean {
		if (event == PlayerStates.ENDED) {
			this.cleanUp();
			return true;
		}

		if (
			(this.action == RepeatableAction.Pause && event == PlayerStates.PAUSED) ||
			(this.action == RepeatableAction.Play && (event == PlayerStates.PLAYING || event == PlayerStates.BUFFERING))
		) {
			this.cleanUp();

			console.log(
				`Repeatable action handler for ${repeatableActionToString(
					this.action
				)} action received matching event ${youTubeStateToString(event)}. Stopping it.`
			);

			return true;
		} else {
			console.log(
				`Unexpected state change to state ${youTubeStateToString(
					event
				)} when waiting for ${repeatableActionToString(this.action)} repeatable state.`
			);
		}

		return false;
	}

	private async handler(): Promise<void> {
		if (this.attemptLimit <= 0) return;

		const state = this.player.getState().state;
		if (state == DoujiPlayerStateEnum.Ended) return;

		switch (this.action) {
			case RepeatableAction.Play:
				if (state == DoujiPlayerStateEnum.Unstarted || state == DoujiPlayerStateEnum.Paused) {
					console.log("Repeatable action handler retrying PLAY");
					await this.player.play(false);
				}
				break;
			case RepeatableAction.Pause:
				if (state == DoujiPlayerStateEnum.Playing || state == DoujiPlayerStateEnum.Buffering) {
					console.log("Repeatable action handler retrying PAUSE");
					await this.player.pause(false);
				}
				break;
		}

		this.attemptLimit--;

		console.log(`Repeatable action handler has ${this.attemptLimit} attempts remaining.`);

		if (this.attemptLimit > 0) {
			this.timeoutId = this.createTimeout();
		} else {
			this.cleanUp();
		}
	}

	public cleanUp(): void {
		if (this.timeoutId != null) {
			clearTimeout(this.timeoutId);
			this.timeoutId = null;
		}
	}
}

export class YouTubeVideoPlayer extends DoujiVideoPlayerTyped<PlayerStates> {
	//TODO Change to private when abstraction implementation is complete
	public readonly player: YouTubePlayer;

	private static readonly videoUrlRegex =
		/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?(?:.+\&)?v=|youtu\.be\/)([a-zA-Z0-9_\-]{11})/i;

	private readonly stateUpdateHandlers: PlayerStateUpdateHandlerTyped<PlayerStates>[] = [];

	private readonly lockName: string = "douji_videoPlayer_lock";

	private readonly timeChangeToleranceSeconds: number = 0.5;

	private repeatableActionHandler: RepeatableYouTubeActionHandler | null = null;

	private currentState: DoujiPlayerState<PlayerStates>;

	public constructor(elementId: string) {
		super();

		this.currentState = new YouTubeStateUnstarted(TimeProvider.getTime());

		this.player = YTPlayer(elementId);

		this.player.on("ready", () => {
			this.player.on("stateChange", async (ev) => {
				const state: PlayerStates = ev.data as PlayerStates;

				await navigator.locks.request(this.lockName, async () => {
					if (this.repeatableActionHandler != null) {
						if (!this.repeatableActionHandler.attemptingToRepeatAction) {
							this.repeatableActionHandler.cleanUp();
							this.repeatableActionHandler = null;
						} else if (this.repeatableActionHandler.notifyOfEvent(state)) {
							this.repeatableActionHandler = null;
						}
					}

					const newState = await this.currentState.acceptEvent(state, this);
					if (newState != null) {
						this.changeState(newState);
					}
				});
			});
		});
	}

	private setRepeatableActionHandler(action: RepeatableAction, attemptLimit: number): void {
		if (this.repeatableActionHandler != null) {
			this.repeatableActionHandler.cleanUp();
			this.repeatableActionHandler = new RepeatableYouTubeActionHandler(this, action, attemptLimit);
		}
	}

	public override getState(): IDoujiPlayerState {
		return this.currentState;
	}

	public override getStateTyped(): DoujiPlayerState<PlayerStates> {
		return this.currentState;
	}

	public override async setState(newState: DoujiPlayerState<PlayerStates>): Promise<void> {
		const currentSupposedTime = this.currentState.getSupposedCurrentTime();
		const currentState = this.currentState.state;

		const newSupposedTime = newState.getSupposedCurrentTime();
		const currentTime = await this.getCurrentVideoTime();

		if (
			newSupposedTime != null &&
			currentTime != undefined &&
			(currentSupposedTime == null ||
				currentSupposedTime == undefined ||
				Math.abs(newSupposedTime - currentTime) > this.timeChangeToleranceSeconds)
		) {
			this.setTime(newSupposedTime);
		}

		if (currentState == undefined || currentState != newState.state) {
			if (newState.state == DoujiPlayerStateEnum.Playing) {
				await this.play();
			} else {
				await this.pause();
			}
		}

		this.changeState(newState);
	}

	public override changeState(newState: DoujiPlayerState<PlayerStates>): void {
		this.currentState.destroy();

		this.currentState = newState;

		for (const handler of this.stateUpdateHandlers) {
			handler(newState);
		}
	}

	public override onStateUpdate(handler: PlayerStateUpdateHandler): void {
		this.stateUpdateHandlers.push(handler);
	}

	public override onStateUpdateTyped(handler: PlayerStateUpdateHandlerTyped<PlayerStates>): void {
		this.stateUpdateHandlers.push(handler);
	}

	public override buildState(
		state: DoujiPlayerStateEnum,
		videoTime: number | null,
		updatedAt: Date
	): DoujiPlayerState<PlayerStates> {
		switch (state) {
			case DoujiPlayerStateEnum.Buffering:
				if (videoTime == null)
					throw new InvalidStateError("Attempted to build 'Buffering' state without video time");
				return new YouTubeStateBuffering(videoTime, updatedAt, this);
			case DoujiPlayerStateEnum.Playing:
				if (videoTime == null)
					throw new InvalidStateError("Attempted to build 'Playing' state without video time");
				return new YouTubeStatePlaying(videoTime, updatedAt);
			case DoujiPlayerStateEnum.Paused:
				if (videoTime == null)
					throw new InvalidStateError("Attempted to build 'Paused' state without video time");
				return new YouTubeStatePaused(videoTime, updatedAt, this);
			case DoujiPlayerStateEnum.Ended:
				return new YouTubeStateEnded(updatedAt);
			case DoujiPlayerStateEnum.Unstarted:
				return new YouTubeStateUnstarted(updatedAt);
		}
	}

	public override async getCurrentVideoTime(): Promise<number | undefined> {
		if (await this.isVideoLoaded()) return this.player.getCurrentTime();
		else return undefined;
	}

	public override async setTime(seconds: number): Promise<boolean> {
		if (!(await this.isVideoLoaded())) return false;

		try {
			await this.player.seekTo(seconds, true);
			return true;
		} catch {
			return false;
		}
	}

	public override async getDuration(): Promise<number | undefined> {
		if (await this.isVideoLoaded()) return this.player.getDuration();
		else return undefined;
	}

	public override async getBufferedTime(): Promise<number | undefined> {
		if (!(await this.isVideoLoaded())) return undefined;

		const [loadedFraction, duration] = await Promise.all([
			this.player.getVideoLoadedFraction(),
			this.player.getDuration(),
		]);

		return loadedFraction * duration;
	}

	public override async isVideoLoaded(): Promise<boolean> {
		const videoUrl = await this.player.getVideoUrl();
		if (videoUrl == undefined) return false;

		return videoUrl.length > 0;
	}

	public override async isPlaying(): Promise<boolean> {
		return (await this.player.getPlayerState()) == PlayerStates.PLAYING;
	}

	public override async isSupposedToPlay(): Promise<boolean> {
		const state = await this.player.getPlayerState();

		return state == PlayerStates.PLAYING || state == PlayerStates.BUFFERING;
	}

	public override async pause(setRetryHandler: boolean = true): Promise<boolean> {
		if (!(await this.isVideoLoaded())) return false;

		if (await this.isSupposedToPlay()) {
			try {
				await this.player.pauseVideo();
			} catch {
				return false;
			}

			if (setRetryHandler) {
				this.setRepeatableActionHandler(RepeatableAction.Pause, 1);
			}

			console.log("Set player to PAUSE");
		} else {
			if (setRetryHandler) {
				this.setRepeatableActionHandler(RepeatableAction.Pause, 3);
			}

			console.log(
				`Pause command received when player is supposedly paused. New retry handler ${
					!setRetryHandler ? "NOT " : ""
				}set.`
			);
		}

		return true;
	}

	public override async play(setRetryHandler: boolean = true): Promise<boolean> {
		if (!(await this.isVideoLoaded())) return false;

		if (!(await this.isSupposedToPlay())) {
			try {
				await this.player.playVideo();
			} catch {
				return false;
			}

			if (setRetryHandler) {
				this.setRepeatableActionHandler(RepeatableAction.Play, 1);
			}

			console.log("Set player to PLAY");
		} else {
			if (setRetryHandler) {
				this.setRepeatableActionHandler(RepeatableAction.Play, 3);
			}

			console.log(
				`Play command received when player is supposedly playing. New retry handler ${
					!setRetryHandler ? "NOT " : ""
				}set.`
			);
		}

		return true;
	}

	public override async loadVideoByUrl(url: string, startSeconds?: number): Promise<boolean> {
		const match = url.match(YouTubeVideoPlayer.videoUrlRegex);

		if (match == null) return false;

		return await this.loadVideoById(match[1], startSeconds);
	}

	public override async loadVideoById(videoId: string, startSeconds?: number): Promise<boolean> {
		try {
			this.changeState(new YouTubeStateUnstarted(TimeProvider.getTime()));

			await this.player.loadVideoById(videoId, startSeconds ?? 0);
			return true;
		} catch {
			return false;
		}
	}

	public override async getLoadedVideoUrl(): Promise<string | undefined> {
		try {
			const url = await this.player.getVideoUrl();
			return url || undefined;
		} catch {
			return undefined;
		}
	}

	public override async getLoadedVideoId(): Promise<string | undefined> {
		const url = await this.getLoadedVideoUrl();
		if (url == undefined) return undefined;

		const match = url.match(YouTubeVideoPlayer.videoUrlRegex);
		if (match == null) return undefined;

		return match[1];
	}

	private ytQualityStringToVideoQuality(str: string): VideoQuality {
		switch (str) {
			case "small":
				return VideoQuality.Low;
			case "medium":
				return VideoQuality.Height360;
			case "large":
				return VideoQuality.Height480;
			case "hd720":
				return VideoQuality.Height720;
			case "hd1080":
				return VideoQuality.Height1080;
			case "highres":
				return VideoQuality.Ultra;
			default:
				return VideoQuality.Unknown;
		}
	}

	private videoQualityToYtQualityString(quality: VideoQuality.Unknown): undefined;
	private videoQualityToYtQualityString(quality: VideoQuality): string;
	private videoQualityToYtQualityString(quality: VideoQuality): string | undefined {
		switch (quality) {
			case VideoQuality.Low:
			case VideoQuality.Height144:
			case VideoQuality.Height240:
				return "small";
			case VideoQuality.Height360:
				return "medium";
			case VideoQuality.Height480:
				return "large";
			case VideoQuality.Height720:
				return "hd720";
			case VideoQuality.Height1080:
				return "hd1080";
			case VideoQuality.Ultra:
				return "highres";
			case VideoQuality.Unknown:
			default:
				return undefined;
		}
	}

	public override async getVideoQuality(): Promise<VideoQuality | undefined> {
		if (!(await this.isVideoLoaded())) return undefined;

		try {
			return this.ytQualityStringToVideoQuality(await this.player.getPlaybackQuality());
		} catch {
			return undefined;
		}
	}

	public override async setVideoQuality(quality: VideoQuality): Promise<VideoQuality | undefined> {
		if (!(await this.isVideoLoaded())) return undefined;

		if (quality != VideoQuality.Unknown) {
			const qualityString = this.videoQualityToYtQualityString(quality);
			try {
				await this.player.setPlaybackQuality(qualityString);
			} catch {}
		}

		return await this.getVideoQuality();
	}

	public override async getAvailableVideoQualities(): Promise<readonly VideoQuality[] | undefined> {
		if (!(await this.isVideoLoaded())) return undefined;

		try {
			const qualities = await this.player.getAvailableQualityLevels();
			if (qualities.length == 0) return undefined;

			return qualities.map((x) => this.ytQualityStringToVideoQuality(x));
		} catch {
			return undefined;
		}
	}

	public override async getPlaybackRate(): Promise<number | undefined> {
		try {
			const rate = await this.player.getPlaybackRate();
			return typeof rate === "number" ? rate : undefined;
		} catch {
			return undefined;
		}
	}

	public override async setPlaybackRate(playbackRate: number): Promise<number | undefined> {
		try {
			await this.player.setPlaybackRate(playbackRate);
		} catch {
			return undefined;
		}

		return this.getPlaybackRate();
	}

	public override async getAvailablePlaybackRates(): Promise<readonly number[] | undefined> {
		try {
			return await this.player.getAvailablePlaybackRates();
		} catch {
			return undefined;
		}
	}

	public override async getVolume(): Promise<number> {
		try {
			const volume = await this.player.getVolume();
			return typeof volume === "number" ? volume : 100;
		} catch {
			return 100;
		}
	}

	public override async setVolume(volume: number): Promise<number> {
		volume = Math.max(Math.min(volume, 100), 0);

		await this.player.setVolume(volume);

		return volume;
	}

	public override async isMuted(): Promise<boolean> {
		return this.player.isMuted();
	}

	public override async mute(): Promise<boolean> {
		try {
			await this.player.mute();
			return true;
		} catch {
			return false;
		}
	}

	public override async unMute(): Promise<boolean> {
		try {
			await this.player.unMute();
			return true;
		} catch {
			return false;
		}
	}
}
