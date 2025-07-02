export class TimeProvider {
	private static _offsetMs: number = 0;
	public static get offsetMs(): number {
		return this._offsetMs;
	}
	public static set offsetMs(value: number) {
		this._offsetMs = value;
		this.offsetSet = true;
	}

	private static _offsetSet: boolean = false;
	public static get offsetSet(): boolean {
		return this._offsetSet;
	}
	private static set offsetSet(value: boolean) {
		this._offsetSet = value;
	}

	public static getTime(): Date {
		return new Date(TimeProvider.now());
	}

	public static now(): number {
		return Date.now() + TimeProvider._offsetMs;
	}
}
