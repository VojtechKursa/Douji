export class ConnectionParameters {
	private static readonly key = "connectionParams";

	public constructor(
		public readonly roomId: number,
		public readonly username: string,
		public readonly reservationId: string
	) {}

	public static load(): ConnectionParameters | undefined {
		const savedString = sessionStorage.getItem(this.key);
		if (savedString == null) return undefined;

		const parsed = JSON.parse(savedString);

		const roomId = parsed["roomId"];
		if (roomId == undefined || typeof roomId !== "number") return undefined;

		const username = parsed["username"];
		if (username == undefined || typeof username !== "string") return undefined;

		const reservationId = parsed["reservationId"];
		if (reservationId == undefined || typeof reservationId !== "string") return undefined;

		return new ConnectionParameters(roomId, username, reservationId);
	}

	public save(): void {
		sessionStorage.setItem(ConnectionParameters.key, JSON.stringify(this));
	}
}
