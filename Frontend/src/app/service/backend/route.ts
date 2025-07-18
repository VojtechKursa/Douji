import { env } from "process";

export async function GET() {
	const url = env.DOUJI_FRONTEND_BACKEND_URL;
	const response = new Response(url ?? "", { status: 200 });

	return response;
}
