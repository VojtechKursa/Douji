import ClientConfig from "@/app/lib/ClientConfig";
import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { WelcomeData } from "./Types/WelcomeData";
import { User } from "./Types/User";
import { IDoujiPlayerState } from "../Player/PlayerStates/Generic/DoujiPlayerState";
import { ClientState, ClientStateUnstarted } from "./ClientStates/ClientState";
import { UserState, UserStateDTO } from "./Types/UserState";
import { RoomState } from "./RoomStates/RoomState";

export type ClientStateChangeHandler = (newState: ClientState, previousState: ClientState) => void;

export class VideoRoomSignalRClient {
	protected readonly connection: HubConnection;
	protected currentState: ClientState;

	protected readonly stateChangeHandlers: ClientStateChangeHandler[] = [];

	constructor(roomId: number, public readonly username: string, password?: string) {
		const query = `roomId=${roomId}&username=${encodeURIComponent(username)}${
			password != null ? `&password=${encodeURIComponent(password)}` : ""
		}`;

		this.connection = new HubConnectionBuilder()
			.withUrl(`${ClientConfig.backendUrl}/hub/room?${query}`)
			.withAutomaticReconnect()
			.configureLogging(ClientConfig.devBuild ? LogLevel.Information : LogLevel.Error)
			.build();

		this.currentState = new ClientStateUnstarted(new Date());
	}

	public async acceptPlayerEvent(state: IDoujiPlayerState): Promise<void> {
		const newState = await this.currentState.acceptEvent(state);

		if (newState != null) {
			const previousState = this.currentState;
			this.currentState = newState;

			const updateAnnouncementPromise = this.connection.invoke(
				"UpdateState",
				newState.updatedAt.toISOString(),
				newState.state,
				newState.videoTime
			);

			for (const handler of this.stateChangeHandlers) {
				handler(newState, previousState);
			}

			await updateAnnouncementPromise;
		}
	}

	public onClientStateUpdate(handler: ClientStateChangeHandler): void {
		this.stateChangeHandlers.push(handler);
	}

	public connect(): Promise<void> {
		return this.connection.start();
	}

	public disconnect(): Promise<void> {
		return this.connection.stop();
	}

	public onWelcome(handler: (data: WelcomeData) => void): void {
		this.connection.on("Welcome", handler);
	}

	public onPlayVideo(handler: (user: User, url: string) => void) {
		this.connection.on("PlayVideo", handler);
	}

	public onUserJoined(handler: (user: User) => void): void {
		this.connection.on("UserJoined", handler);
	}

	public onUserLeft(handler: (user: User) => void): void {
		this.connection.on("UserLeft", handler);
	}

	public onForcedDisconnect(handler: (reason: string | undefined) => void): void {
		this.connection.on("ForcedDisconnect", handler);
	}

	public onUserStateUpdate(handler: (userState: UserState) => void): void {
		this.connection.on("UpdateClientState", (stateAny) => {
			handler(UserStateDTO.fromObject(stateAny).toUserState());
		});
	}

	public onRoomStateUpdate(handler: (roomState: RoomState) => void): void {
		this.connection.on("UpdateRoomState", handler);
	}

	public onClose(handler: (error?: Error) => void): void {
		this.connection.onclose(handler);
	}

	public playVideo(url: string): void {
		this.connection.invoke("Play", url);
	}
}
