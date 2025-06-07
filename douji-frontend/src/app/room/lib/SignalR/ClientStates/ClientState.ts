import { DoujiPlayerStateEnum, IDoujiPlayerState } from "../../Player/PlayerStates/Generic/DoujiPlayerState";

export const enum ClientStateEnum {
	Unstarted = 0,
	Playing = 1,
	Paused = 2,
	Buffering = 3,
	Waiting = 4,
	Ended = 5,
}

export abstract class ClientState {
	public constructor(
		public readonly state: ClientStateEnum,
		public readonly videoTime: number | null,
		public readonly updatedAt: Date
	) {}

	abstract acceptEvent(state: IDoujiPlayerState): Promise<ClientState | null>;

	destroy(): void {}
}

export class ClientStateUnstarted extends ClientState {
	public constructor(updatedAt: Date) {
		super(ClientStateEnum.Unstarted, null, updatedAt);
	}

	public override acceptEvent(state: IDoujiPlayerState): Promise<ClientState | null> {
		switch (state.state) {
			case DoujiPlayerStateEnum.Buffering:
				return Promise.resolve(new ClientStateBuffering(state.videoTime ?? 0, state.updatedAt));
			case DoujiPlayerStateEnum.Ended:
				return Promise.resolve(new ClientStateEnded(state.updatedAt));
			default:
				console.log(`Unexpected client state transition from state UNSTARTED to ${state.state}. Ignoring it.`);
				return Promise.resolve(null);
		}
	}
}

export class ClientStateEnded extends ClientState {
	public constructor(updatedAt: Date) {
		super(ClientStateEnum.Ended, null, updatedAt);
	}

	public override acceptEvent(state: IDoujiPlayerState): Promise<ClientState | null> {
		switch (state.state) {
			case DoujiPlayerStateEnum.Buffering:
				return Promise.resolve(new ClientStateBuffering(state.videoTime ?? 0, state.updatedAt));
			default:
				console.log(`Unexpected client state transition from state ENDED to ${state.state}. Ignoring it.`);
				return Promise.resolve(null);
		}
	}
}

export class ClientStateBuffering extends ClientState {
	public constructor(videoTime: number, updatedAt: Date) {
		super(ClientStateEnum.Buffering, videoTime, updatedAt);
	}

	public override acceptEvent(state: IDoujiPlayerState): Promise<ClientState | null> {
		//TODO Implement waiting state

		switch (state.state) {
			case DoujiPlayerStateEnum.Ended:
				return Promise.resolve(new ClientStateEnded(state.updatedAt));
			case DoujiPlayerStateEnum.Buffering:
				return Promise.resolve(new ClientStateBuffering(state.videoTime ?? 0, state.updatedAt));
			case DoujiPlayerStateEnum.Playing:
				return Promise.resolve(new ClientStatePlaying(state.videoTime ?? 0, state.updatedAt));
			case DoujiPlayerStateEnum.Paused:
				return Promise.resolve(new ClientStatePaused(state.videoTime ?? 0, state.updatedAt));
			default:
				console.log(`Unexpected client state transition from state BUFFERING to ${state.state}. Ignoring it.`);
				return Promise.resolve(null);
		}
	}
}

//TODO Implement waiting state

export class ClientStatePlaying extends ClientState {
	public constructor(videoTime: number, updatedAt: Date) {
		super(ClientStateEnum.Playing, videoTime, updatedAt);
	}

	public override acceptEvent(state: IDoujiPlayerState): Promise<ClientState | null> {
		//TODO Implement waiting state

		switch (state.state) {
			case DoujiPlayerStateEnum.Ended:
				return Promise.resolve(new ClientStateEnded(state.updatedAt));
			case DoujiPlayerStateEnum.Buffering:
				return Promise.resolve(new ClientStateBuffering(state.videoTime ?? 0, state.updatedAt));
			case DoujiPlayerStateEnum.Playing:
				return Promise.resolve(new ClientStatePlaying(state.videoTime ?? 0, state.updatedAt));
			case DoujiPlayerStateEnum.Paused:
				return Promise.resolve(new ClientStatePaused(state.videoTime ?? 0, state.updatedAt));
			default:
				console.log(`Unexpected client state transition from state PLAYING to ${state.state}. Ignoring it.`);
				return Promise.resolve(null);
		}
	}
}

export class ClientStatePaused extends ClientState {
	public constructor(videoTime: number, updatedAt: Date) {
		super(ClientStateEnum.Paused, videoTime, updatedAt);
	}

	public override acceptEvent(state: IDoujiPlayerState): Promise<ClientState | null> {
		//TODO Implement waiting state

		switch (state.state) {
			case DoujiPlayerStateEnum.Ended:
				return Promise.resolve(new ClientStateEnded(state.updatedAt));
			case DoujiPlayerStateEnum.Buffering:
				return Promise.resolve(new ClientStateBuffering(state.videoTime ?? 0, state.updatedAt));
			case DoujiPlayerStateEnum.Playing:
				return Promise.resolve(new ClientStatePlaying(state.videoTime ?? 0, state.updatedAt));
			case DoujiPlayerStateEnum.Paused:
				return Promise.resolve(new ClientStatePaused(state.videoTime ?? 0, state.updatedAt));
			default:
				console.log(`Unexpected client state transition from state PAUSED to ${state.state}. Ignoring it.`);
				return Promise.resolve(null);
		}
	}
}
