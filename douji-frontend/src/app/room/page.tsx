import { Container } from "react-bootstrap";
import { VideoRoom } from "./components/VideoRoom";

import "./style.scss";

export default function VideoRoomPage() {
	return (
		<Container fluid className="mt-2">
			<VideoRoom />
		</Container>
	);
}
