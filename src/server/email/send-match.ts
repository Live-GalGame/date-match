export interface MatchEmailData {
  toEmail: string;
  partnerEmail: string;
  partnerName: string | null;
  compatibility: number;
  reasons: string[];
  week: string;
}

export async function sendMatchEmail(data: MatchEmailData) {
  if (process.env.NODE_ENV === "development") {
    console.log(`\n[Match Email] To: ${data.toEmail}`);
    console.log(`[Match Email] Partner: ${data.partnerEmail}`);
    console.log(`[Match Email] Compatibility: ${data.compatibility}%`);
    console.log(`[Match Email] Reasons: ${data.reasons.join(", ")}\n`);
    return;
  }

  const { Resend } = await import("resend");
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is missing");
  }
  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM?.trim() || "Date Match <noreply@datematch.com>";
  const replyTo = process.env.REPLY_TO_EMAIL?.trim();

  const { data: sentEmail, error } = await resend.emails.send({
    from,
    replyTo: replyTo || undefined,
    to: data.toEmail,
    subject: `Your Date Match for ${data.week}`,
    tags: [{ name: "email_type", value: "match_result" }],
    html: `
      <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 40px 20px; background: #fdf6f0;">
        <h1 style="color: #8b2252; font-size: 28px; margin-bottom: 8px;">date match.</h1>
        <p style="color: #6b5449; font-size: 14px; margin-bottom: 32px;">Week ${data.week}</p>

        <div style="background: white; border-radius: 16px; padding: 28px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          <h2 style="color: #2d1b14; font-size: 22px; margin: 0 0 16px;">Your match: ${data.partnerName || "Someone special"}</h2>
          <p style="margin: 6px 0; font-size: 15px;">📧 ${data.partnerEmail}</p>
          <p style="margin: 6px 0; font-size: 15px;">🎯 ${data.compatibility}% compatibility</p>

          <h3 style="color: #2d1b14; font-size: 16px; margin: 20px 0 10px;">Here's why:</h3>
          <ul style="padding-left: 0; list-style: none; margin: 0;">
            ${data.reasons.map((r) => `<li style="margin: 8px 0; padding-left: 16px; position: relative; color: #6b5449; font-size: 14px; line-height: 1.5;"><span style="position: absolute; left: 0; color: #8b2252;">•</span>${r}</li>`).join("")}
          </ul>
        </div>

        <p style="color: #6b5449; font-size: 15px; line-height: 1.6;">
          Now it's your turn — reach out, grab coffee, and see where it goes.
        </p>

        <p style="color: #6b5449; font-size: 12px; margin-top: 32px;">
          Date Match — Find your person without swiping.
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(
      `[resend] ${error.name} (${error.statusCode ?? "unknown"}): ${error.message}`
    );
  }

  return sentEmail?.id ?? null;
}
