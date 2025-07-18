export default class ClientConfig {
	public static readonly devBuild: boolean = (process.env.NEXT_PUBLIC_DEV_BUILD ?? "0") == "1";
}