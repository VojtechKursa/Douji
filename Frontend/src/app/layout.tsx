import type { Metadata } from "next";

import "@/app/globals.scss";

export const metadata: Metadata = {
	title: "Douji",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
