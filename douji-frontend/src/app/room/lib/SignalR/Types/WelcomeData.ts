import { RoomState, RoomStateDTO } from "../RoomStates/RoomState";
import { UserState, UserStateDTO } from "./UserState";

export class WelcomeData {
	public constructor(
		public readonly userStates: UserState[],
		public readonly roomState: RoomState,
		public readonly currentlyPlayedURL: string | null
	) {}
}

export interface WelcomeDataDTO {
	userStates: UserStateDTO[];
	roomState: RoomStateDTO;
	currentlyPlayedURL: string | null;
}

export function welcomeDataDtoParse(dto: WelcomeDataDTO): WelcomeData {
	return new WelcomeData(
		dto.userStates.map((stateDto) => UserStateDTO.fromObject(stateDto).toUserState()),
		RoomStateDTO.fromObject(dto.roomState).toRoomState(),
		dto.currentlyPlayedURL
	);
}
