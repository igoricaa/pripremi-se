import { Heading, Section, Text } from "@react-email/components";
import { Button } from "./Button";
import { Layout } from "./Layout";
import SupportSection from "./SupportSection";

const ChangeEmailTemplate = ({
	verificationUrl,
	studentName,
	newEmail,
}: {
	verificationUrl: string;
	studentName: string;
	newEmail: string;
}) => {
	return (
		<Layout
			preview="Potvrdite novu email adresu za vaš nalog"
			title="Promena email adrese"
			subtitle="Zatražili ste promenu email adrese za vaš nalog"
		>
			{/* Main Content */}
			<Section className="mb-8">
				<Text className="text-base text-gray-700 mb-4">
					Pozdrav {studentName},
				</Text>
				<Text className="text-base text-gray-700 mb-4 leading-6">
					Primili smo zahtev za promenu email adrese vašeg naloga na Pripremi se platformi.
				</Text>
				<Text className="text-base text-gray-700 mb-6 leading-6">
					Nova email adresa: <strong>{newEmail}</strong>
				</Text>
				<Text className="text-base text-gray-700 mb-6 leading-6">
					Da biste potvrdili ovu promenu, kliknite na dugme ispod:
				</Text>
			</Section>

			{/* CTA Button */}
			<Section className="text-center mb-8">
				<Button
					href={verificationUrl}
					className="bg-blue-600 text-white px-8 py-4 rounded-md text-base font-semibold no-underline box-border"
				>
					Potvrdite novu email adresu
				</Button>
			</Section>

			{/* Security Notice */}
			<Section className="mb-8 bg-amber-50 p-6 rounded-md">
				<Heading className="text-xl font-bold text-gray-900 m-0 mb-4">
					Bezbednosno obaveštenje
				</Heading>
				<Text className="text-sm text-gray-700 m-0 mb-2">
					Ako niste vi zatražili ovu promenu, možete bezbedno ignorisati ovaj email.
					Vaša trenutna email adresa će ostati nepromenjena.
				</Text>
				<Text className="text-sm text-gray-700 m-0">
					Link za verifikaciju ističe za 24 sata.
				</Text>
			</Section>

			{/* Fallback Link */}
			<Section className="mb-8">
				<Text className="text-sm text-gray-600 mb-2">
					Ako dugme ne radi, kopirajte i nalepite sledeći link u vaš browser:
				</Text>
				<Text className="text-sm text-blue-600 break-all">
					{verificationUrl}
				</Text>
			</Section>

			<SupportSection />
		</Layout>
	);
};

ChangeEmailTemplate.PreviewProps = {
	verificationUrl: "https://ekvilibrijum.rs/api/auth/verify-email-change?token=abc123xyz789",
	studentName: "Igor",
	newEmail: "nova.adresa@example.com",
};

export default ChangeEmailTemplate;
