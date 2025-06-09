import { DoujiVideoPlayerTyped } from "../../Players/DoujiVideoPlayer";

export interface IDoujiPlayerState {
	readonly state: DoujiPlayerStateEnum;
	readonly videoTime: number | null;
	readonly external: boolean;
	readonly updatedAt: Date;

	getSupposedCurrentTime(): number | null;
}

export class InvalidStateError extends Error {
	public constructor(message: string) {
		super(message);
	}
}

export abstract class DoujiPlayerState<T> implements IDoujiPlayerState {
	public constructor(
		public readonly state: DoujiPlayerStateEnum,
		public readonly videoTime: number | null,
		public readonly external: boolean,
		public readonly updatedAt: Date
	) {}

	abstract acceptEvent(state: T, player: DoujiVideoPlayerTyped<T>): Promise<DoujiPlayerState<T> | null>;

	destroy(): void {}

	public getSupposedCurrentTime(): number | null {
		if (this.videoTime == null) return null;

		if (this.state == DoujiPlayerStateEnum.Playing) {
			return (Date.now() - this.updatedAt.getTime()) / 1000 + this.videoTime;
		} else {
			return this.videoTime;
		}
	}
}

export const enum DoujiPlayerStateEnum {
	Unstarted = 0,
	Buffering = 1,
	Playing = 2,
	Paused = 3,
	Ended = 4,
}

export function doujiPlayerStateToString(state: DoujiPlayerStateEnum): string {
	switch (state) {
		case DoujiPlayerStateEnum.Unstarted:
			return "Unstarted";
		case DoujiPlayerStateEnum.Buffering:
			return "Buffering";
		case DoujiPlayerStateEnum.Playing:
			return "Playing";
		case DoujiPlayerStateEnum.Paused:
			return "Paused";
		case DoujiPlayerStateEnum.Ended:
			return "Ended";
		default:
			return `Unknown (${state})`;
	}
}

export abstract class DoujiPlayerStateUnstarted<T> extends DoujiPlayerState<T> {
	public constructor(external: boolean, updatedAt: Date) {
		super(DoujiPlayerStateEnum.Unstarted, null, external, updatedAt);
	}
}

export abstract class DoujiPlayerStatePlaying<T> extends DoujiPlayerState<T> {
	public constructor(videoTime: number, external: boolean, updatedAt: Date) {
		super(DoujiPlayerStateEnum.Playing, videoTime, external, updatedAt);
	}
}

export abstract class DoujiPlayerStateEnded<T> extends DoujiPlayerState<T> {
	public constructor(external: boolean, updatedAt: Date) {
		super(DoujiPlayerStateEnum.Ended, null, external, updatedAt);
	}
}

abstract class DoujiPlayerStateWithStaticTimeCheck<T> extends DoujiPlayerState<T> {
	private timeAtLastCheck: number;
	private timeLastCheckedAt: Date;
	private timeCheckIntervalId: number | NodeJS.Timeout | null;

	private readonly timeCheckIntervalMs: number = 500;
	private readonly timeCheckToleranceSeconds: number = 0.5;

	public constructor(
		state: DoujiPlayerStateEnum,
		videoTime: number,
		external: boolean,
		updatedAt: Date,
		private readonly player: DoujiVideoPlayerTyped<T>
	) {
		super(state, videoTime, external, updatedAt);

		this.timeAtLastCheck = videoTime;
		this.timeLastCheckedAt = updatedAt;
		this.timeCheckIntervalId = setInterval(async () => await this.checkVideoTime(), this.timeCheckIntervalMs);
	}

	public override destroy(): void {
		if (this.timeCheckIntervalId != null) {
			clearInterval(this.timeCheckIntervalId);
			this.timeCheckIntervalId = null;
		}
	}

	// Only call this from interval whose ID is saved in this.timeCheckIntervalId
	protected async checkVideoTime(): Promise<void> {
		// In case the tick happened before the interval was cleared in state change
		if (this.timeCheckIntervalId == null) return;

		const now = new Date();
		const currentTime = await this.player.getCurrentVideoTime();

		if (currentTime == undefined) return;

		if (this.timeLastCheckedAt != null && this.timeAtLastCheck != null) {
			const difference = currentTime - this.timeAtLastCheck;

			if (Math.abs(difference) > this.timeCheckToleranceSeconds) {
				console.log(
					`Difference discovered by ${doujiPlayerStateToString(this.state)} video time scanner. Current: ${currentTime}. At last check: ${this.timeAtLastCheck}.`
				);

				const newState = this.buildUpdatedState(currentTime, false, now, this.player);

				this.player.changeState(newState);
			}
		}

		this.timeLastCheckedAt = now;
		this.timeAtLastCheck = currentTime;
	}

	protected abstract buildUpdatedState(
		videoTime: number,
		external: boolean,
		updatedAt: Date,
		player: DoujiVideoPlayerTyped<T>
	): DoujiPlayerStateWithStaticTimeCheck<T>;
}

export abstract class DoujiPlayerStatePaused<T> extends DoujiPlayerStateWithStaticTimeCheck<T> {
	public constructor(videoTime: number, external: boolean, updatedAt: Date, player: DoujiVideoPlayerTyped<T>) {
		super(DoujiPlayerStateEnum.Paused, videoTime, external, updatedAt, player);
	}
}

export abstract class DoujiPlayerStateBuffering<T> extends DoujiPlayerStateWithStaticTimeCheck<T> {
	public constructor(videoTime: number, external: boolean, updatedAt: Date, player: DoujiVideoPlayerTyped<T>) {
		super(DoujiPlayerStateEnum.Buffering, videoTime, external, updatedAt, player);
	}
}
