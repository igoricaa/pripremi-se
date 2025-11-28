// import "./polyfills";
// import { render } from "@react-email/components";

import { Resend } from "@convex-dev/resend";
import { render } from "@react-email/render";
import { components } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";
import ResetPasswordEmailTemplate from "./emails/components/resetPassword";
import VerifyEmailTemplate from "./emails/components/verifyEmail";

export const resend = new Resend(components.resend, {
	testMode: false,
});

// export const sendTestEmail = internalMutation({
//   handler: async (ctx) => {
//     await resend.sendEmail(ctx, {
//       from: "Me <test@mydomain.com>",
//       to: "delivered@resend.dev",
//       subject: "Hi there",
//       html: "This is a test email",
//     });
//   },
// });

export const sendEmailVerification = async (
	ctx: ActionCtx,
	{
		to,
		studentName,
		token,
	}: {
		to: string;
		studentName: string;
		token: string;
	}
) => {
	const siteUrl = process.env.SITE_URL || "http://localhost:3001";
	const verificationUrl = `${siteUrl}/api/auth/verify-email?token=${token}&callbackURL=/dashboard?verified=true`;

	await resend.sendEmail(ctx, {
		from: "EKVI <noreply@ekvilibrijum.rs>",
		to,
		subject: "Verify your email address",
		html: await render(
			<VerifyEmailTemplate verificationUrl={verificationUrl} studentName={studentName} />
		),
	});
};

export const sendResetPassword = async (
	ctx: ActionCtx,
	{
		to,
		url,
		studentName,
		expirationTime,
	}: {
		to: string;
		url: string;
		studentName: string;
		expirationTime: string;
	}
) => {
	await resend.sendEmail(ctx, {
		from: "EKVI <noreply@ekvilibrijum.rs>",
		to,
		subject: "Reset your password",
		html: await render(<ResetPasswordEmailTemplate resetUrl={url} studentName={studentName} expirationTime={expirationTime} />),
	});
};
