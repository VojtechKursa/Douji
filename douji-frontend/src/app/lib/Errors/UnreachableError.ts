export class UnreachableError extends Error {
	public constructor(message?: string) {
		super(
			"Normally unreachable error was reached. This is equivalent to a run-time assertion failure." +
				`${message != undefined && message.length > 0 ? `Message: ${message}` : ""}`
		);
	}
}
