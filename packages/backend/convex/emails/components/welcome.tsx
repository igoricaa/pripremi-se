import { Heading, Section, Text } from "@react-email/components";
import { Button } from "./Button";
import { Layout } from "./Layout";
import SupportSection from "./SupportSection";

const WelcomeEmailTemplate = ({
	name,
	dashboardUrl,
	programsUrl: _programsUrl,
	communityUrl: _communityUrl,
	// supportUrl,
}: {
	name: string;
	dashboardUrl: string;
	programsUrl: string;
	communityUrl: string;
	// supportUrl: string;
}) => {
	return (
		<Layout preview="Dobrodošli u Pripremi se!" title="Dobrodošli u Pripremi se!" subtitle="Spremni ste za početak vaše priprema">
			{/* Main Content */}
			 <Section className="mb-8">
              <Text className="text-base text-gray-700 mb-4">
                Pozdrav {name},
              </Text>
              <Text className="text-base text-gray-700 mb-4 leading-6">
                Čestitamo! Uspešno ste kreirali nalog na Pripremi se platformi. 
                Sada ste deo zajednice učenika koji ozbiljno pristupaju pripremi za prijemne ispite.
              </Text>
              <Text className="text-base text-gray-700 mb-6 leading-6">
                Vaš put ka uspešnom polaganju prijemnog ispita počinje upravo sada. 
                Pripremili smo sve što vam je potrebno za odličnu pripremu!
              </Text>
            </Section>

            {/* CTA Button */}
            <Section className="text-center mb-8">
              <Button
                href={dashboardUrl}
                className="bg-green-600 text-white px-8 py-4 rounded-md text-base font-semibold no-underline box-border"
              >
                Počni sa učenjem
              </Button>
            </Section>

            {/* What's Available */}
            <Section className="mb-8 bg-green-50 p-6 rounded-md">
              <Heading className="text-xl font-bold text-gray-900 m-0 mb-4">
                Šta možete da radite odmah:
              </Heading>
              <Text className="text-sm text-gray-700 m-0 mb-3">
                📖 <strong>Pristupite lekcijama</strong> - Počnite sa prvom lekcijom iz srpskog jezika ili matematike
              </Text>
              <Text className="text-sm text-gray-700 m-0 mb-3">
                🎯 <strong>Rešavajte testove</strong> - Proverite svoje znanje sa našim probnim testovima
              </Text>
              <Text className="text-sm text-gray-700 m-0 mb-3">
                📊 <strong>Pratite napredak</strong> - Vidite koliko ste napredovali kroz statistike
              </Text>
              <Text className="text-sm text-gray-700 m-0">
                👤 <strong>Dopunite profil</strong> - Dodajte informacije o sebi za personalizovano iskustvo
              </Text>
            </Section>

            {/* Getting Started Tips */}
            <Section className="mb-8 bg-blue-50 p-6 rounded-md">
              <Heading className="text-xl font-bold text-gray-900 m-0 mb-4">
                Saveti za početak:
              </Heading>
              <Text className="text-sm text-gray-700 m-0 mb-2">
                ✅ Postavite cilj - koliko vremena dnevno možete da posvetite učenju
              </Text>
              <Text className="text-sm text-gray-700 m-0 mb-2">
                ✅ Redovno vežbajte - bolje je 30 minuta dnevno nego 3 sata jednom nedeljno
              </Text>
              <Text className="text-sm text-gray-700 m-0 mb-2">
                ✅ Pratite svoj napredak i slavite male pobede
              </Text>
              <Text className="text-sm text-gray-700 m-0">
                ✅ Ne oklевajte da postavite pitanje ako vam nešto nije jasno
              </Text>
            </Section>

            {/* Quick Actions */}
            <Section className="mb-8">
              <Heading className="text-lg font-bold text-gray-900 m-0 mb-4">
                Brze akcije:
              </Heading>
              <Section className="text-center">
                <Button
                  href={dashboardUrl}
                  className="bg-blue-600 text-white px-8 py-3 rounded-md text-base font-medium no-underline box-border mr-3 mb-3"
                >
                  Dopuni profil
                </Button>
                <Button
                  href={dashboardUrl}
                  className="bg-gray-600 text-white px-6 py-3 rounded-md text-sm font-medium no-underline box-border mb-3"
                >
                  Pogledaj dashboard
                </Button>
              </Section>
            </Section>

			<SupportSection />
		</Layout>
	);
};

WelcomeEmailTemplate.PreviewProps = {
	name: "John Doe",
	dashboardUrl: "https://pripremi-se.app/dashboard",
	programsUrl: "https://pripremi-se.app/programs",
	communityUrl: "https://pripremi-se.app/community",
	supportUrl: "https://pripremi-se.app/support",
	userEmail: "stanisavljevic.igor@proton.me",
};

export default WelcomeEmailTemplate;
