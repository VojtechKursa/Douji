import ClientConfig from "@/app/lib/ClientConfig";
import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { WelcomeData, WelcomeDataDTO, welcomeDataDtoParse } from "./Types/WelcomeData";
import { User } from "./Types/User";
import { IDoujiPlayerState } from "../Player/PlayerStates/Generic/DoujiPlayerState";
import { ClientState, ClientStateUnstarted } from "./ClientStates/ClientState";
import { UserState, UserStateDTO } from "./Types/UserState";
import { RoomState, RoomStateDTO, RoomStateEnum } from "./RoomStates/RoomState";
import { TimeProvider } from "@/app/lib/TimeProvider";

export type ClientStateChangeHandler = (newState: ClientState, previousState: ClientState) => void;

export class VideoRoomSignalRClient {
	protected readonly connection: HubConnection;
	protected clientState: ClientState;
	protected roomState: RoomState;

	protected readonly stateChangeHandlers: ClientStateChangeHandler[] = [];

	private readonly onConnectedHandlers: (() => void)[] = [];
	private readonly onRejectedHandlers: ((reason: string | undefined) => void)[] = [];

	constructor(backendUrl: string, roomId: number, reservationId: string, username: string) {
		const query = `roomId=${roomId}&username=${encodeURI(username)}&reservation=${encodeURI(reservationId)}`;

		this.connection = new HubConnectionBuilder()
			.withUrl(`${backendUrl}/hub/room?${query}`)
			.withAutomaticReconnect()
			.configureLogging(ClientConfig.devBuild ? LogLevel.Information : LogLevel.Error)
			.build();

		this.clientState = new ClientStateUnstarted(TimeProvider.getTime());
		this.roomState = new RoomState(RoomStateEnum.Unstarted, null, new Date(0));

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
		return this.connection.start().then(
			() => {
				for (const handler of this.onConnectedHandlers) {
					handler();
				}
			},
			(r) => {
				const reason = typeof r === "string" ? r : undefined;

				for (const handler of this.onRejectedHandlers) {
					handler(reason);
				}
			}
		);
	}

	public disconnect(): Promise<void> {
		return this.connection.stop();
	}

	public onConnected(handler: () => void): void {
		this.onConnectedHandlers.push(handler);
	}

	public onRejected(handler: (reason: string | undefined) => void): void {
		this.onRejectedHandlers.push(handler);
	}

	public onWelcome(handler: (data: WelcomeData) => void): void {
		this.connection.on("Welcome", (data: WelcomeDataDTO) => {
			handler(welcomeDataDtoParse(data));
		});
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

	public async requestServerTimeOffsetMs(): Promise<number> {
		const requestedAt = new Date();
		const requestResult = await this.connection.invoke("GetTime", requestedAt.toISOString());
		const arrivedAt = Date.now();

		const serverTime = new Date(requestResult);

		const tripTime = (arrivedAt - requestedAt.getTime()) / 2;
		const currentServerTime = serverTime.getTime() + tripTime + (Date.now() - arrivedAt);

		return currentServerTime - Date.now();
	}

	protected async callPlayVideo(url: string): Promise<void> {
		await this.connection.invoke("Play", url);
	}

	protected async callUpdateState(state: ClientState): Promise<void> {
		await this.connection.invoke("UpdateState", state.updatedAt.toISOString(), state.state, state.videoTime);
	}
}
