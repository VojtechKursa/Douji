import { User } from "./User";

export interface WelcomeData {
	users: User[];
	currentlyPlayedUrl: string | null;
}
