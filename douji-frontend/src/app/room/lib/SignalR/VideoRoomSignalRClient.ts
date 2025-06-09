import ClientConfig from "@/app/lib/ClientConfig";
import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { WelcomeData } from "./Types/WelcomeData";
import { User } from "./Types/User";
import { IDoujiPlayerState } from "../Player/PlayerStates/Generic/DoujiPlayerState";
import { ClientState, ClientStateUnstarted } from "./ClientStates/ClientState";
import { UserState, UserStateDTO } from "./Types/UserState";
import { RoomState, RoomStateDTO, RoomStateEnum } from "./RoomStates/RoomState";

export type ClientStateChangeHandler = (newState: ClientState, previousState: ClientState) => void;

export class VideoRoomSignalRClient {
	protected readonly connection: HubConnection;
	protected clientState: ClientState;
	protected roomState: RoomState;

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

		this.clientState = new ClientStateUnstarted(new Date());
		this.roomState = new RoomState(RoomStateEnum.Unstarted, null, new Date());

		this.connection.on("UpdateRoomState", (stateAny) => {
			const roomState = RoomStateDTO.fromObject(stateAny).toRoomState();
			this.roomState = roomState;
		});
	}

	public async acceptPlayerEvent(state: IDoujiPlayerState): Promise<void> {
		const newState = await this.clientState.acceptEvent(state);

		if (newState != null) {
			this.setClientState(newState, true, true);
		}
	}

	public async setClientState(
		state: ClientState,
		announceToServer: boolean = true,
		triggerEvents: boolean = true
	): Promise<void> {
		const previousState = this.clientState;
		this.clientState = state;

		let serverAnnouncePromise: Promise<void> | null = null;
		if (announceToServer) {
			serverAnnouncePromise = this.callUpdateState(state);
		}

		if (triggerEvents) {
			for (const handler of this.stateChangeHandlers) {
				handler(state, previousState);
			}
		}

		await serverAnnouncePromise;
	}

	public getClientState(): ClientState {
		return this.clientState;
	}

	public getRoomState(): RoomState {
		return this.roomState;
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
		this.connection.on("UpdateRoomState", (stateAny) => {
			handler(RoomStateDTO.fromObject(stateAny).toRoomState());
		});
	}

	public onClose(handler: (error?: Error) => void): void {
		this.connection.onclose(handler);
	}

	public async playVideo(url: string): Promise<void> {
		await this.callPlayVideo(url);
	}

	protected async callPlayVideo(url: string): Promise<void> {
		await this.connection.invoke("Play", url);
	}

	protected async callUpdateState(state: ClientState): Promise<void> {
		await this.connection.invoke("UpdateState", state.updatedAt.toISOString(), state.state, state.videoTime);
	}
}
