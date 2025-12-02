import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { authComponent, createAuth } from "./auth";
import { resend } from "./email";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth, {
	cors: {
		allowedOrigins: [
			process.env.SITE_URL || "http://localhost:3000",
			"http://localhost:3000",
		],
		allowedHeaders: ["Content-Type", "Authorization"],
	},
});

http.route({
	path: "/resend-webhook",
	method: "POST",
	handler: httpAction(
		async (ctx, req) => await resend.handleResendEventWebhook(ctx, req)
	),
});

export default http;
