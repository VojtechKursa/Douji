import { UserState } from "./UserState";

export interface WelcomeData {
	userStates: UserState[];
	currentlyPlayedURL: string | null;
}
