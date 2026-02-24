import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink } from "better-auth/plugins";
import { db } from "@/server/db";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: false,
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        if (process.env.NODE_ENV === "development") {
          console.log(`\n[Magic Link] Email: ${email}\n[Magic Link] URL: ${url}\n`);
          return;
        }
        const { Resend } = await import("resend");
        const apiKey = process.env.RESEND_API_KEY?.trim();
        if (!apiKey) {
          throw new Error("RESEND_API_KEY is missing");
        }
        const resend = new Resend(apiKey);
        const from = process.env.EMAIL_FROM?.trim() || "Date Match <noreply@datematch.com>";
        const { error } = await resend.emails.send({
          from,
          to: email,
          subject: "Sign in to Date Match",
          tags: [{ name: "email_type", value: "magic_link" }],
          html: `
            <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
              <h1 style="color: #8b2252; font-size: 28px;">Date Match</h1>
              <p style="color: #2d1b14; font-size: 16px; line-height: 1.6;">
                Click the button below to sign in. This link will expire in 5 minutes.
              </p>
              <a href="${url}" style="display: inline-block; background: #8b2252; color: white; padding: 14px 32px; border-radius: 9999px; text-decoration: none; font-size: 16px; margin: 20px 0;">
                Sign In
              </a>
              <p style="color: #6b5449; font-size: 13px;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>
          `,
        });

        if (error) {
          throw new Error(
            `[resend] ${error.name} (${error.statusCode ?? "unknown"}): ${error.message}`
          );
        }
      },
    }),
  ],
});
