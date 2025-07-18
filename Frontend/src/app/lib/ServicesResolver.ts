import { UnreachableError } from "./Errors/UnreachableError";

export const enum Service {
	Backend = "backend",
}

export class ServiceResolverFailedError extends Error {
	public constructor(service: Service, responseCode: number | undefined = undefined) {
		super(
			`Service resolver for service ${service} failed${
				responseCode != undefined ? ` with response code ${responseCode}` : ""
			}.`
		);
	}
}

export class ServicesResolver {
	private static _instance: ServicesResolver | undefined = undefined;
	public static get instance(): ServicesResolver {
		if (this._instance == undefined) {
			this._instance = new ServicesResolver();
		}

		return this._instance;
	}

	private readonly ongoingRequests = new Map<Service, Promise<void> | undefined>();
	private readonly services = new Map<Service, string>();
	private readonly resolveEndpoints = new Map<Service, string>([[Service.Backend, "/service/backend"]]);

	public async getService(service: Service): Promise<string> {
		let resolveFunction: (() => void) | undefined = undefined;

		const ongoing = this.ongoingRequests.get(service);
		if (ongoing != undefined) await ongoing;

		const cached = this.services.get(service);
		if (cached != undefined) return cached;

		const endpoint = this.resolveEndpoints.get(service);
		if (endpoint == undefined) {
			throw new UnreachableError(`Resolver endpoint for service '${service}' isn't specified`);
		}

		const promise = new Promise<void>((resolve) => (resolveFunction = resolve));
		this.ongoingRequests.set(service, promise);

		const response = await fetch(endpoint);
		if (!response.ok) {
			throw new ServiceResolverFailedError(service, response.status);
		}

		const url = await response.text();
		this.services.set(service, url);
		this.ongoingRequests.set(service, undefined);

		if (resolveFunction != undefined) {
			//@ts-expect-error Function can be set externally outside of the function's scope
			resolveFunction();
		}

		return url;
	}
}
