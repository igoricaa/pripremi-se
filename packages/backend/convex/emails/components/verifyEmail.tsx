import { Heading, Link, Section, Text } from "@react-email/components";
import { Button } from "./Button";
import { Layout } from "./Layout";
import SupportSection from "./SupportSection";

const VerifyEmailTemplate = ({
	verificationUrl,
	studentName,
}: {
	verificationUrl: string;
	studentName: string;
}) => {
	return (
		<Layout preview="Potvrdite svoj nalog i počnite pripremu za prijemni" title="Dobrodošli u Pripremi se!" subtitle="Vaš put ka uspešnom polaganju prijemnog počinje ovde">
			{/* Main Content */}
            <Section className="mb-8">
				<Text className="text-base text-gray-700 mb-4">
					Pozdrav {studentName},
				</Text>
				<Text className="text-base text-gray-700 mb-4 leading-6">
					Hvala vam što ste se pridružili Pripremi se platformi! Spremni smo da vam pomognemo 
					da se odlično pripremite za prijemne ispite za srednje škole i fakultete u Srbiji.
				</Text>
				<Text className="text-base text-gray-700 mb-6 leading-6">
					Da biste aktivirali svoj nalog i počeli sa učenjem, potrebno je samo da 
					potvrdite svoju email adresu klikom na dugme ispod:
				</Text>
            </Section>

            {/* CTA Button */}
            <Section className="text-center mb-8">
				<Button
					href={verificationUrl}
					className="bg-blue-600 text-white px-8 py-4 rounded-md text-base font-semibold no-underline box-border"
				>
					Potvrdite email adresu
				</Button>
            </Section>

            {/* What's Next */}
            <Section className="mb-8 bg-blue-50 p-6 rounded-md">
				<Heading className="text-xl font-bold text-gray-900 m-0 mb-4">
					Šta vas čeka:
				</Heading>
				<Text className="text-sm text-gray-700 m-0 mb-2">
					📚 Struktuiran kurikulum kreiran od strane vrhunskih profesora
				</Text>
				<Text className="text-sm text-gray-700 m-0 mb-2">
					📝 Testovi nakon svake lekcije sa detaljnim objašnjenjima
				</Text>
				<Text className="text-sm text-gray-700 m-0 mb-2">
					📊 Praćenje napretka za vas i vaše roditelje
				</Text>
				<Text className="text-sm text-gray-700 m-0">
					🎯 Fokus na srpski jezik i matematiku za srednje škole
				</Text>
            </Section>


  			<Section className="mb-8">
				<Text className="text-sm text-gray-600 mb-2">
					Kopirajte i nalepite sledeći link u vaš browser:
              	</Text>
				<Text className="text-base text-blue-600 break-all">
					{verificationUrl}
				</Text>
            </Section>


			{/* What's Next Section */}
			 <Section className="mb-[32px]">
				<Text className="text-[14px] text-gray-600 mb-[8px]">
					Ako dugme ne radi, kopirajte i nalepite sledeći link u vaš browser:
				</Text>
				<Text className="text-[14px] text-blue-600 break-all">
					{verificationUrl}
				</Text>
            </Section>
			
			<SupportSection />
		</Layout>
	);
};

VerifyEmailTemplate.PreviewProps = {
	verificationUrl: "https://ekvilibrijum.rs/verify-email?token=abc123xyz789",
	userEmail: "stanisavljevic.igor@proton.me",
};

export default VerifyEmailTemplate;
