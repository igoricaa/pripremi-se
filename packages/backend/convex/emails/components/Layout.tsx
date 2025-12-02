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
	title:string;
	subtitle:string;
};

export const Layout = ({ preview, children, title, subtitle }: LayoutProps) => (
	<Html dir="ltr" lang="sr-RS">
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
			<Body className="bg-gray-100 font-sans py-10">
				<Container className="bg-white rounded-[8px] shadow-lg max-w-[600px] mx-auto p-10">
					<Header title={title} subtitle={subtitle} />
					{children}
					<Footer />
				</Container>
			</Body>
		</Tailwind>
	</Html>
);
