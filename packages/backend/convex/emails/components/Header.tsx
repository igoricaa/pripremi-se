import { Heading, Section, Text } from "@react-email/components";

export const Header = ({ title, subtitle }: { title: string; subtitle: string }) => (
	<Section className="text-center mb-8">
		<Heading className="text-3xl font-bold text-gray-900 m-0 mb-2">
			{title}
		</Heading>
		<Text className="text-base text-gray-600 m-0">
			{subtitle}
		</Text>
	</Section>
);
