function ensureEnvironmentValue<T>(key: string, value: T | undefined): T {
	if (value == undefined)
		throw new Error(`Config value "${key}" is undefined`);

	return value;
}

export default class ClientConfig {
	public static readonly backendUrl: string = ensureEnvironmentValue("NEXT_PUBLIC_BACKEND_URL", process.env.NEXT_PUBLIC_BACKEND_URL);
	public static readonly devBuild: boolean = (process.env.NEXT_PUBLIC_DEV_BUILD ?? "0") == "1";
}