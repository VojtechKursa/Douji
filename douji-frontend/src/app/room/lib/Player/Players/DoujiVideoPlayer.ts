import { DoujiPlayerState, DoujiPlayerStateEnum, IDoujiPlayerState } from "../PlayerStates/Generic/DoujiPlayerState";

export type PlayerStateUpdateHandler = (currentState: IDoujiPlayerState) => void;
export type PlayerStateUpdateHandlerTyped<T> = (currentState: DoujiPlayerState<T>) => void;

export const enum VideoQuality {
	Unknown,
	Low,
	Height144,
	Height240,
	Height360,
	Height480,
	Height720,
	Height1080,
	Ultra,
}

export abstract class DoujiVideoPlayer {
	public abstract getCurrentVideoTime(): Promise<number | undefined>;
	public abstract getDuration(): Promise<number | undefined>;
	public abstract getBufferedTime(): Promise<number | undefined>;

	public abstract isVideoLoaded(): Promise<boolean>;
	public abstract isPlaying(): Promise<boolean>;
	public abstract isSupposedToPlay(): Promise<boolean>;

	public abstract loadVideoByUrl(url: string, startSeconds?: number): Promise<boolean>;
	public abstract loadVideoById(id: string, startSeconds?: number): Promise<boolean>;

	public abstract getLoadedVideoUrl(): Promise<string | undefined> | undefined;
	public abstract getLoadedVideoId(): Promise<string | undefined> | undefined;

	public abstract getVideoQuality(): Promise<VideoQuality | undefined>;
	public abstract setVideoQuality(quality: VideoQuality): Promise<VideoQuality | undefined>;
	public abstract getAvailableVideoQualities(): Promise<readonly VideoQuality[] | undefined>;

	public abstract getPlaybackRate(): Promise<number | undefined>;
	public abstract setPlaybackRate(playbackRate: number): Promise<number | undefined>;
	public abstract getAvailablePlaybackRates(): Promise<readonly number[] | undefined>;

	public abstract getVolume(): Promise<number>;
	public abstract setVolume(volume: number): Promise<number>;

	public abstract isMuted(): Promise<boolean>;
	public abstract mute(): Promise<boolean>;
	public abstract unMute(): Promise<boolean>;

	public abstract getState(): IDoujiPlayerState;
	public abstract onStateUpdate(handler: PlayerStateUpdateHandler): void;

	public abstract setTime(seconds: number): Promise<boolean>;

	public abstract play(): Promise<boolean>;
	public abstract pause(): Promise<boolean>;
}

export abstract class DoujiVideoPlayerTyped<T> extends DoujiVideoPlayer {
	public abstract getStateTyped(): DoujiPlayerState<T>;
	public abstract changeState(newState: DoujiPlayerState<T>): void;
	public abstract setState(newState: DoujiPlayerState<T>): Promise<void>;

	public abstract onStateUpdateTyped(handler: PlayerStateUpdateHandlerTyped<T>): void;

	public abstract buildState(
		state: DoujiPlayerStateEnum,
		videoTime: number | null,
		updatedAt: Date
	): DoujiPlayerState<T>;
}
