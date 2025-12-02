import { Section, Text } from "@react-email/components";

export const Footer = () => (
	<Section className="border-t border-solid border-gray-200 pt-6">
		<Text className="text-xs text-gray-500 text-center m-0 mb-2">
			Pripremi se - Priprema za prijemne ispite
		</Text>
		<Text className="text-xs text-gray-500 text-center m-0 mb-2">
			Beograd, Srbija
		</Text>
		<Text className="text-xs text-gray-500 text-center m-0">
			© 2025 Pripremi se. Sva prava zadržana.
		</Text>
	</Section>
);
