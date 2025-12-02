import { Heading, Link, Section, Text } from "@react-email/components";

const SupportSection = () => (
	<Section className="mb-8 bg-gray-50 p-6 rounded-md">
		<Heading className="text-xl font-bold text-gray-900 m-0 mb-4">
			Potrebna vam je pomoć?
		</Heading>
		<Text className="text-sm text-gray-700 m-0 mb-2">
			Ako imate problema sa resetovanjem lozinke ili bilo kakva pitanja, 
			slobodno nas kontaktirajte na:
		</Text>
		<Text className="text-sm text-blue-600 m-0">
			podrska@pripremi-se.app
		</Text>
	</Section>
);

export default SupportSection;
