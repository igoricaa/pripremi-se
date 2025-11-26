import { Link, Section, Text } from "@react-email/components";

const SupportSection = () => (
	<Section className="mb-8">
		<Text className="m-0 text-gray-400 text-sm leading-[20px]">
			Need help? Our support team is here to assist you. Reply to this email or
			contact us at{" "}
			<Link
				className="text-primary underline"
				href="mailto:support@ekvilibrijum.rs"
			>
				support@ekvilibrijum.rs
			</Link>
		</Text>
	</Section>
);

export default SupportSection;
