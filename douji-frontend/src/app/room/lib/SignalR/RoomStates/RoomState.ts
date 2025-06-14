import { TimeProvider } from "@/app/lib/TimeProvider";

export const enum RoomStateEnum {
	Unstarted = 0,
	Playing = 1,
	Paused = 2,
	Waiting = 4,
	Ended = 5,
}

export class RoomState {
	public constructor(
		public readonly state: RoomStateEnum,
		public readonly videoTime: number | null,
		public readonly updatedAt: Date
	) {}

	public getCurrentExpectedTime(): number | null {
		if (this.videoTime == null)
			return null;

		return ((TimeProvider.now() - this.updatedAt.getTime()) / 1000) + this.videoTime;
	}
}

export class RoomStateDTO {
	public constructor(
		public readonly state: RoomStateEnum,
		public readonly videoTime: number | null,
		public readonly updatedAt: string
	) {}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static fromObject(obj: any): RoomStateDTO {
		return new RoomStateDTO(obj["state"], obj["videoTime"], obj["updatedAt"]);
	}

	public toRoomState(): RoomState {
		return new RoomState(this.state, this.videoTime, new Date(this.updatedAt));
	}
}
