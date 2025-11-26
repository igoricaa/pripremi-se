import { Heading, Link, Section, Text } from "@react-email/components";
import { Button } from "./Button";
import { Layout } from "./Layout";
import SupportSection from "./SupportSection";

const VerifyEmailTemplate = ({
	verificationUrl,
}: {
	verificationUrl: string;
}) => {
	return (
		<Layout preview="Verify your email to start your EKVI journey">
			{/* Main Content */}
			<Section className="mb-8">
				<Heading className="m-0 mb-4 font-bold text-2xl text-white">
					Verify Your Email Address
				</Heading>

				<Text className="m-0 mb-4 text-base text-gray-300 leading-[24px]">
					Welcome to EKVI! We're excited to have you join our community of
					athletes, coaches, and movement enthusiasts.
				</Text>

				<Text className="m-0 mb-12 text-base text-gray-300 leading-[24px]">
					To complete your registration and start accessing evidence-based
					training programs, masterclasses, and mentorship opportunities, please
					verify your email address by clicking the button below:
				</Text>

				<Section className="my-8 text-center">
					<Button href={verificationUrl}>Verify Email Address</Button>
				</Section>

				<Text className="m-0 mb-4 text-gray-400 text-sm leading-[20px]">
					If the button doesn't work, you can copy and paste this link into your
					browser:
				</Text>

				<Text className="m-0 mb-6 break-all text-primary text-sm">
					<Link className="text-primary underline" href={verificationUrl}>
						{verificationUrl}
					</Link>
				</Text>

				<Text className="m-0 text-gray-400 text-sm leading-[20px]">
					This verification link will expire in 24 hours for security purposes.
				</Text>
			</Section>

			{/* What's Next Section */}
			<Section className="mb-8 rounded-[8px] bg-gray-900 p-6">
				<Heading className="m-0 mb-4 font-bold text-lg text-white">
					What's waiting for you on EKVI:
				</Heading>

				<Text className="m-0 mb-2 text-gray-300 text-sm leading-[20px]">
					• Access to evidence-based training programs across all disciplines
				</Text>
				<Text className="m-0 mb-2 text-gray-300 text-sm leading-[20px]">
					• Direct mentorship from experienced coaches and sport professionals
				</Text>
				<Text className="m-0 mb-2 text-gray-300 text-sm leading-[20px]">
					• Video-based courses and masterclasses for every skill level
				</Text>
				<Text className="m-0 mb-2 text-gray-300 text-sm leading-[20px]">
					• Progress tracking with video analysis support
				</Text>
				<Text className="m-0 text-gray-300 text-sm leading-[20px]">
					• A supportive community focused on sustainable, intelligent movement
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
