import {
	Body,
	Container,
	Head,
	Html,
	Preview,
	Tailwind,
} from "@react-email/components";
import { Footer } from "./Footer";
import { Header } from "./Header";

type LayoutProps = {
	preview: string;
	children: React.ReactNode;
};

export const Layout = ({ preview, children }: LayoutProps) => (
	<Html dir="ltr" lang="en">
		<Head />
		<Preview>{preview}</Preview>
		<Tailwind
			config={{
				theme: {
					extend: {
						colors: {
							primary: "#09f097",
							background: "#0d0d0e",
							foreground: "#fff",
						},
					},
				},
			}}
		>
			<Body className="bg-background py-10 font-sans">
				<Container className="mx-auto max-w-[600px] rounded-[8px] bg-background p-10">
					<Header />
					{children}
					<Footer />
				</Container>
			</Body>
		</Tailwind>
	</Html>
);
