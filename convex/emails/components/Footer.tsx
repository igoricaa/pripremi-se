import { Section, Text } from "@react-email/components";

export const Footer = () => (
	<Section className="border-gray-700 border-t pt-6">
		<Text className="m-0 mb-2 text-gray-500 text-xs">EKVI Platform</Text>
		<Text className="m-0 mb-2 text-gray-500 text-xs">
			123 Movement Street, Wellness City, WC 12345
		</Text>
		<Text className="m-0 text-gray-500 text-xs">
			� {new Date().getFullYear()} EKVI. All rights reserved.
		</Text>
	</Section>
);
