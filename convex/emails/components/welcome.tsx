import { Heading, Link, Section, Text } from "@react-email/components";
import { Button } from "./Button";
import { Layout } from "./Layout";
import SupportSection from "./SupportSection";

const WelcomeEmailTemplate = ({
	userName,
	dashboardUrl,
	programsUrl,
	communityUrl,
	// supportUrl,
}: {
	userName: string;
	dashboardUrl: string;
	programsUrl: string;
	communityUrl: string;
	// supportUrl: string;
}) => {
	return (
		<Layout preview="Welcome to EKVI - Your movement journey starts now!">
			{/* Main Content */}
			<Section className="mb-[32px]">
				<Heading className="m-0 mb-[16px] font-bold text-[24px] text-white">
					Welcome to EKVI, {userName}! 🎉
				</Heading>

				<Text className="m-0 mb-[16px] text-[16px] text-gray-300 leading-[24px]">
					Congratulations! Your email has been verified and you're now
					officially part of the EKVI community. We're thrilled to have you join
					thousands of athletes, coaches, and movement enthusiasts on their
					journey to smarter, more sustainable training.
				</Text>

				<Text className="m-0 mb-[48px] text-[16px] text-gray-300 leading-[24px]">
					Your account is fully activated and ready to explore. Let's get you
					started with everything EKVI has to offer:
				</Text>

				<Section className="my-8 text-center">
					<Button href={dashboardUrl}>Go to Your Dashboard</Button>
				</Section>
			</Section>

			{/* Next Steps Section */}
			<Section className="mb-[32px] rounded-[8px] bg-gray-900 p-[24px]">
				<Heading className="m-0 mb-[16px] font-bold text-[18px] text-white">
					Your Next Steps
				</Heading>

				<Text className="m-0 mb-[16px] text-[14px] text-gray-300 leading-[20px]">
					<strong className="text-white">1. Complete Your Profile</strong>
					<br />
					Add your training background, goals, and preferences to get
					personalized recommendations.
				</Text>

				<Text className="m-0 mb-[16px] text-[14px] text-gray-300 leading-[20px]">
					<strong className="text-white">2. Explore Training Programs</strong>
					<br />
					Browse our evidence-based programs designed for every skill level and
					discipline.
				</Text>

				<Text className="m-0 mb-[16px] text-[14px] text-gray-300 leading-[20px]">
					<strong className="text-white">3. Join the Community</strong>
					<br />
					Connect with fellow athletes and coaches in our supportive community
					forums.
				</Text>

				<Text className="m-0 text-[14px] text-gray-300 leading-[20px]">
					<strong className="text-white">4. Book Your First Session</strong>
					<br />
					Schedule a mentorship session or join a masterclass to accelerate your
					progress.
				</Text>
			</Section>

			{/* Key Resources Section */}
			<Section className="mb-8">
				<Heading className="m-0 mb-[16px] font-bold text-[18px] text-white">
					Key Resources to Get Started
				</Heading>

				<Section className="mb-4">
					<Button href={programsUrl} variant="secondary">
						Browse Programs
					</Button>
					<Button href={communityUrl} variant="secondary">
						Join Community
					</Button>
				</Section>

				<Text className="m-0 mb-[12px] text-[14px] text-gray-300 leading-[20px]">
					<Link
						className="text-primary underline"
						href={`${dashboardUrl}/library`}
					>
						Knowledge Library
					</Link>{" "}
					- Access our comprehensive collection of articles and research
				</Text>

				<Text className="m-0 mb-[12px] text-[14px] text-gray-300 leading-[20px]">
					<Link
						className="text-primary underline"
						href={`${dashboardUrl}/masterclasses`}
					>
						Masterclasses
					</Link>{" "}
					- Learn from industry experts through video courses
				</Text>

				<Text className="m-0 mb-[12px] text-[14px] text-gray-300 leading-[20px]">
					<Link
						className="text-primary underline"
						href={`${dashboardUrl}/mentorship`}
					>
						Find a Mentor
					</Link>{" "}
					- Connect with experienced coaches for personalized guidance
				</Text>

				<Text className="m-0 mb-[12px] text-[14px] text-gray-300 leading-[20px]">
					<Link
						className="text-primary underline"
						href={`${dashboardUrl}/mobile-app`}
					>
						Mobile App
					</Link>{" "}
					- Download our app for training on the go
				</Text>

				<Text className="m-0 text-[14px] text-gray-300 leading-[20px]">
					<Link
						className="text-primary underline"
						href={`${dashboardUrl}/progress`}
					>
						Progress Tracking
					</Link>{" "}
					- Monitor your development with our advanced analytics
				</Text>
			</Section>

			{/* Community Message */}
			<Section className="mb-8 rounded-md border border-primary border-opacity-30 bg-primary bg-opacity-10 p-6">
				<Text className="m-0 text-center text-[14px] text-black leading-[20px]">
					<strong className="text-black">Pro Tip:</strong> Introduce yourself in
					the community forum and let us know what you're working on. Our
					members love welcoming newcomers and sharing their experiences!
				</Text>
			</Section>

			<SupportSection />
		</Layout>
	);
};

WelcomeEmailTemplate.PreviewProps = {
	userName: "John Doe",
	dashboardUrl: "https://ekvilibrijum.rs/dashboard",
	programsUrl: "https://ekvilibrijum.rs/programs",
	communityUrl: "https://ekvilibrijum.rs/community",
	supportUrl: "https://ekvilibrijum.rs/support",
	userEmail: "stanisavljevic.igor@proton.me",
};

export default WelcomeEmailTemplate;
