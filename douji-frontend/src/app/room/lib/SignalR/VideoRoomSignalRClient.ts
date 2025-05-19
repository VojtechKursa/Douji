import ClientConfig from '@/app/lib/ClientConfig';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { WelcomeData } from './Types/WelcomeData';
import { User } from './Types/User';

export class VideoRoomSignalRClient {
	protected readonly connection: HubConnection;

	constructor(roomId: number, username: string, password?: string) {
		const query = `roomId=${roomId}&username=${encodeURIComponent(username)}${password != null ? `&password=${encodeURIComponent(password)}` : ""}`;

		this.connection = new HubConnectionBuilder()
			.withUrl(`${ClientConfig.backendUrl}/hub/room?${query}`)
			.withAutomaticReconnect()
			.configureLogging(ClientConfig.devBuild ? LogLevel.Information : LogLevel.Error)
			.build();
	}

	public async connect(): Promise<void> {
		try {
			await this.connection.start();
		} catch (err) {
			console.log(err);
		}
	}

	public disconnect(): void {
		this.connection.stop();
	}

	public onMethod(method: "Welcome", handler: (welcomeData: WelcomeData) => void): void;
	public onMethod(method: "PlayVideo", handler: (user: User, url: string) => void): void;
	public onMethod(method: "UserJoined", handler: (user: User) => void): void;
	public onMethod(method: "UserLeft", handler: (user: User) => void): void;
	public onMethod(method: "ForcedDisconnect", handler: (reason: string | undefined) => void): void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public onMethod(method: string, handler: (...args: any[]) => any): void {
		this.connection.on(method, handler);
	}

	public onClose(handler: (error?: Error) => void): void {
		this.connection.onclose(handler);
	}

	public play(url: string): void {
		this.connection.invoke("Play", url);
	}
}
