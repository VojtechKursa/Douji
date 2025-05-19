export class ConnectionParameters {
	private static readonly key = "connectionParams";

	public readonly dateCreatedUnix: number;

	public constructor(
		public readonly roomId: number,
		public readonly username: string,
		public readonly password?: string,
		dateCreated?: Date | number
	) {
		if (dateCreated == undefined)
			this.dateCreatedUnix = Date.now();
		else if (typeof dateCreated === "number")
			this.dateCreatedUnix = dateCreated;
		else
			this.dateCreatedUnix = dateCreated.getTime();
	}

	public static load(): ConnectionParameters | undefined {
		const savedString = sessionStorage.getItem(this.key);
		if (savedString == null)
			return undefined;

		const parsed = JSON.parse(savedString);

		const dateCreatedNum = parsed["dateCreatedUnix"];
		if (dateCreatedNum == undefined || typeof dateCreatedNum !== "number")
			return undefined;

		const dateCreated = new Date(dateCreatedNum);
		if (Number.isNaN(dateCreated.getTime()))
			return undefined;

		const roomId = parsed["roomId"];
		if (roomId == undefined || typeof roomId !== "number")
			return undefined;

		const username = parsed["username"];
		if (username == undefined || typeof username !== "string")
			return undefined;

		const password = parsed["password"] as string | undefined;

		return new ConnectionParameters(roomId, username, password, dateCreated);
	}

	public save(): void {
		sessionStorage.setItem(ConnectionParameters.key, JSON.stringify(this));
	}
}