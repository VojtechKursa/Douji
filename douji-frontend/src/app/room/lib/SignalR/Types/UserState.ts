import {
	ClientState,
	ClientStateBuffering,
	ClientStateEnded,
	ClientStateEnum,
	ClientStatePaused,
	ClientStatePlaying,
	ClientStateUnstarted,
} from "../ClientStates/ClientState";
import { User } from "./User";

export class UserState {
	public constructor(public readonly user: User, public readonly state?: ClientState) {}
}

export class ClientStateDTO {
	public constructor(
		public readonly state: ClientStateEnum,
		public readonly videoTime: number | null,
		public readonly updatedAt: string
	) {}
}

function getVideoTimeOrThrow(clientStateDTO: ClientStateDTO): number {
	if (clientStateDTO.videoTime == null)
		throw new Error("Video time in ClientStateDTO was requested as not null, but it is null.");

	return clientStateDTO.videoTime;
}

export class UserStateDTO {
	public constructor(public readonly user: User, public readonly state?: ClientStateDTO) {}

	public toUserState(): UserState {
		let state: ClientState | undefined = undefined;

		if (this.state != undefined) {
			const updatedAt = new Date(this.state.updatedAt);

			switch (this.state.state) {
				case ClientStateEnum.Buffering:
					state = new ClientStateBuffering(getVideoTimeOrThrow(this.state), updatedAt);
					break;
				case ClientStateEnum.Ended:
					state = new ClientStateEnded(updatedAt);
					break;
				case ClientStateEnum.Paused:
					state = new ClientStatePaused(getVideoTimeOrThrow(this.state), updatedAt);
					break;
				case ClientStateEnum.Playing:
					state = new ClientStatePlaying(getVideoTimeOrThrow(this.state), updatedAt);
					break;
				case ClientStateEnum.Unstarted:
					state = new ClientStateUnstarted(updatedAt);
					break;
				case ClientStateEnum.Waiting:
					throw new Error("Not implemented");
				default:
					break;
			}
		}

		return new UserState(this.user, state);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static fromObject(obj: any): UserStateDTO {
		return new UserStateDTO(obj["user"], obj["state"]);
	}
}
