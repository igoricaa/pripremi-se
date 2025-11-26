import { Heading, Link, Section, Text } from "@react-email/components";
import { Button } from "./Button";
import { Layout } from "./Layout";
import SupportSection from "./SupportSection";

const ResetPasswordEmailTemplate = ({
	resetUrl,
	// userEmail,
}: {
	resetUrl: string;
	// userEmail: string;
}) => {
	return (
		<Layout preview="Reset your EKVI password securely">
			{/* Main Content */}
			<Section className="mb-[32px]">
				<Heading className="m-0 mb-[16px] font-bold text-[24px] text-white">
					Reset Your Password
				</Heading>

				<Text className="m-0 mb-[16px] text-[16px] text-gray-300 leading-[24px]">
					We received a request to reset the password for your EKVI account.
					Don't worry - it happens to the best of us!
				</Text>

				<Text className="m-0 mb-[48px] text-[16px] text-gray-300 leading-[24px]">
					To create a new password and regain access to your training programs,
					masterclasses, and mentorship opportunities, click the button below:
				</Text>

				<Section className="my-8 text-center">
					<Button href={resetUrl}>Reset Password</Button>
				</Section>

				<Text className="m-0 mb-[16px] text-[14px] text-gray-400 leading-[20px]">
					If the button doesn't work, you can copy and paste this link into your
					browser:
				</Text>

				<Text className="m-0 mb-[24px] break-all text-[14px] text-primary">
					<Link className="text-primary underline" href={resetUrl}>
						{resetUrl}
					</Link>
				</Text>

				<Text className="m-0 text-[14px] text-gray-400 leading-[20px]">
					This password reset link will expire in 1 hour for security purposes.
				</Text>
			</Section>

			{/* Security Notice */}
			<Section className="mb-[32px] rounded-[8px] bg-gray-900 p-[24px]">
				<Heading className="m-0 mb-[16px] font-bold text-[18px] text-white">
					Security Notice
				</Heading>

				<Text className="m-0 mb-[16px] text-[14px] text-gray-300 leading-[20px]">
					If you didn't request this password reset, you can safely ignore this
					email. Your account remains secure and no changes will be made.
				</Text>

				<Text className="m-0 mb-[16px] text-[14px] text-gray-300 leading-[20px]">
					For your security, we recommend:
				</Text>

				<Text className="m-0 mb-[8px] text-[14px] text-gray-300 leading-[20px]">
					• Using a strong, unique password for your EKVI account
				</Text>
				<Text className="m-0 mb-[8px] text-[14px] text-gray-300 leading-[20px]">
					• Enabling two-factor authentication when available
				</Text>
				<Text className="m-0 text-[14px] text-gray-300 leading-[20px]">
					• Never sharing your login credentials with others
				</Text>
			</Section>

			<SupportSection />
		</Layout>
	);
};

ResetPasswordEmailTemplate.PreviewProps = {
	resetUrl: "https://ekvilibrijum.rs/reset-password?token=abc123xyz789",
	userEmail: "stanisavljevic.igor@proton.me",
};

export default ResetPasswordEmailTemplate;
