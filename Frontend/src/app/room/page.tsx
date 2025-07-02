import { Container } from "react-bootstrap";
import { VideoRoom } from "./components/VideoRoom";
import Link from "next/link";

import "./style.scss";

export default function VideoRoomPage() {
	return (
		<Container fluid className="mt-2">
			<Link href="/" className="btn btn-primary mb-2">Back</Link>
			<VideoRoom />
		</Container>
	);
}
