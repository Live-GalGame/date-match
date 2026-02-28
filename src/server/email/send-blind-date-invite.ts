import crypto from "crypto";

export interface BlindDateInviteData {
  userId: string;
  toEmail: string;
  displayName: string | null;
  matchCount: number;
  week: string;
}

export function createBlindDateToken(userId: string): string {
  const secret = process.env.BETTER_AUTH_SECRET || "";
  return crypto
    .createHmac("sha256", secret)
    .update(`blind:${userId}`)
    .digest("hex")
    .slice(0, 16);
}

export function verifyBlindDateToken(userId: string, token: string): boolean {
  return createBlindDateToken(userId) === token;
}

export async function sendBlindDateInvite(data: BlindDateInviteData) {
  const baseUrl = (process.env.BETTER_AUTH_URL || "http://localhost:3000").replace(/\/+$/, "");
  const token = createBlindDateToken(data.userId);
  const blindDateUrl = `${baseUrl}/blind-date?u=${data.userId}&t=${token}&w=${data.week}`;

  if (process.env.NODE_ENV === "development") {
    console.log(`\n[BlindDate Invite] To: ${data.toEmail}`);
    console.log(`[BlindDate Invite] Matches: ${data.matchCount}`);
    console.log(`[BlindDate Invite] URL: ${blindDateUrl}\n`);
    return;
  }

  const { Resend } = await import("resend");
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error("RESEND_API_KEY is missing");
  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM?.trim() || "Date Match <noreply@datematch.com>";
  const replyTo = process.env.REPLY_TO_EMAIL?.trim();

  const name = data.displayName || "同学";

  const { error } = await resend.emails.send({
    from,
    replyTo: replyTo || undefined,
    to: data.toEmail,
    subject: `🎲 你有 ${data.matchCount} 个匿名匹配等待揭晓`,
    tags: [{ name: "email_type", value: "blind_date_invite" }],
    html: `
      <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 40px 20px; background: #fdf6f0;">
        <h1 style="color: #8b2252; font-size: 28px; margin-bottom: 8px;">date match.</h1>
        <p style="color: #6b5449; font-size: 14px; margin-bottom: 32px;">${data.week} · 匿名匹配</p>

        <div style="background: white; border-radius: 16px; padding: 28px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          <h2 style="color: #2d1b14; font-size: 20px; margin: 0 0 16px;">Hi ${name}，</h2>
          <p style="color: #6b5449; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
            本周我们根据你的心理学问卷，为你匹配了 <strong style="color: #8b2252;">${data.matchCount} 位</strong>潜在灵魂匹配对象。
          </p>
          <p style="color: #6b5449; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
            TA们的身份目前是匿名的——你可以看到兼容度分数、匹配理由和匿名档案，但看不到联系方式。浏览后给每位对象打个分，如果<strong>双方都对彼此感兴趣</strong>，我们会立刻为你们揭晓身份 ✨
          </p>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${blindDateUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #8b2252, #c2185b);
                      color: white; text-decoration: none; padding: 14px 36px;
                      border-radius: 28px; font-size: 16px; font-weight: 600;
                      box-shadow: 0 4px 12px rgba(139,34,82,0.3);">
              查看我的匿名匹配
            </a>
          </div>
        </div>

        <div style="background: #fff8f0; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
          <p style="color: #6b5449; font-size: 13px; line-height: 1.6; margin: 0;">
            💡 <strong>双向奔赴机制</strong>：只有当你和对方都给彼此打了 4 星及以上，系统才会互相揭示联系方式。你的评分完全保密，对方不会看到。
          </p>
        </div>

        <p style="color: #b09080; font-size: 12px; margin-top: 32px; text-align: center;">
          Date Match — 不靠刷脸，靠灵魂找到你的人。
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`[resend] ${error.name}: ${error.message}`);
  }
}
