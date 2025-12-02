import { Heading, Link, Section, Text } from "@react-email/components";
import { Button } from "./Button";
import { Layout } from "./Layout";
import SupportSection from "./SupportSection";

const ResetPasswordEmailTemplate = ({
	resetUrl,
	studentName,
	expirationTime,
	// userEmail,
}: {
	resetUrl: string;
	studentName: string;
	expirationTime: string;
	// userEmail: string;
}) => {
	return (
		<Layout preview="Resetujte svoju lozinku za Pripremi se nalog" title="Resetovanje lozinke" subtitle="Pripremi se - Vaš partner u pripremi za prijemni">
			{/* Main Content */}
            <Section className="mb-8">
				<Text className="text-base text-gray-700 mb-4">
					Pozdrav {studentName},
				</Text>
				<Text className="text-base text-gray-700 mb-4 leading-6">
					Primili smo zahtev za resetovanje lozinke za vaš Pripremi se nalog. Ako ste vi poslali ovaj zahtev, kliknite na dugme ispod da kreirate novu lozinku.
				</Text>
				<Text className="text-base text-gray-700 mb-6 leading-6">
					Ako niste vi poslali ovaj zahtev, možete bezbedno ignorisati ovaj email. Vaša lozinka neće biti promenjena.
				</Text>
            </Section>

            {/* CTA Button */}
            <Section className="text-center mb-8">
				<Button
					href={resetUrl}
					className="bg-blue-600 text-white px-8 py-4 rounded-md text-base font-semibold no-underline box-border"
				>
					Resetuj lozinku
				</Button>
            </Section>

            <Section className="mb-8 bg-red-50 p-6 rounded-md border-l-4 border-solid border-red-500">
              <Heading className="text-lg font-bold text-red-800 m-0 mb-4">
                Važne bezbednosne napomene:
              </Heading>
              <Text className="text-sm text-red-700 m-0 mb-2">
                🔒 Ovaj link je valjan samo {expirationTime} minuta
              </Text>
              <Text className="text-sm text-red-700 m-0 mb-2">
                🔒 Link može biti korišćen samo jednom
              </Text>
              <Text className="text-sm text-red-700 m-0 mb-2">
                🔒 Nikada ne delite ovaj link sa drugim osobama
              </Text>
              <Text className="text-sm text-red-700 m-0">
                🔒 Ako niste vi zatražili resetovanje, kontaktirajte nas odmah
              </Text>
            </Section>


  			<Section className="mb-8">
				<Text className="text-sm text-gray-600 mb-2">
					Kopirajte i nalepite sledeći link u vaš browser:
              	</Text>
				<Text className="text-base text-blue-600 break-all">
					{resetUrl}
				</Text>
            </Section>


			{/* What's Next Section */}
			 <Section className="mb-8">
				<Text className="text-sm text-gray-600 mb-2">
					Ako dugme ne radi, kopirajte i nalepite sledeći link u vaš browser:
				</Text>
				<Text className="text-sm text-blue-600 break-all">
					{resetUrl}
				</Text>
            </Section>

			<SupportSection />
		</Layout>
	);
};

ResetPasswordEmailTemplate.PreviewProps = {
	resetUrl: "https://ekvilibrijum.rs/reset-password?token=abc123xyz789",
	studentName: "Igor Stanisavljević",
	expirationTime: "10",
};

export default ResetPasswordEmailTemplate;
