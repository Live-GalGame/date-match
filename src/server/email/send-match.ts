import crypto from "crypto";

export interface MatchEmailData {
  matchId: string;
  userId: string;
  toEmail: string;
  partnerEmail: string;
  partnerName: string | null;
  compatibility: number;
  reasons: string[];
  week: string;
  aiInsight?: string;
}

export function createFeedbackToken(matchId: string, userId: string): string {
  const secret = process.env.BETTER_AUTH_SECRET || "";
  return crypto
    .createHmac("sha256", secret)
    .update(`${matchId}:${userId}`)
    .digest("hex")
    .slice(0, 16);
}

function buildQuickRatingUrl(baseUrl: string, matchId: string, userId: string, score: number): string {
  const token = createFeedbackToken(matchId, userId);
  return `${baseUrl}/api/feedback?m=${matchId}&u=${userId}&s=${score}&t=${token}`;
}

function buildDetailFeedbackUrl(baseUrl: string, matchId: string, userId: string): string {
  const token = createFeedbackToken(matchId, userId);
  return `${baseUrl}/feedback?m=${matchId}&u=${userId}&t=${token}`;
}

function buildAiInsightHtml(aiInsight?: string): string {
  if (!aiInsight) return "";
  const escaped = aiInsight.replace(/\n/g, "<br>");
  return `
    <div style="background: linear-gradient(135deg, #f8f0ff 0%, #fff0f5 100%); border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #8b2252;">
      <p style="color: #8b2252; font-size: 13px; font-weight: 600; margin: 0 0 10px;">✨ AI 心理咨询师的牵线语</p>
      <p style="color: #2d1b14; font-size: 14px; line-height: 1.7; margin: 0;">${escaped}</p>
    </div>`;
}

function buildFeedbackHtml(baseUrl: string, matchId: string, userId: string): string {
  const emojis = ["😟", "😐", "🙂", "😊", "🥰"];
  const labels = ["不合适", "一般", "还行", "不错", "超期待"];
  const links = emojis
    .map(
      (emoji, i) =>
        `<a href="${buildQuickRatingUrl(baseUrl, matchId, userId, i + 1)}" style="text-decoration:none;display:inline-block;text-align:center;margin:0 2px;">`
        + `<span style="font-size:32px;display:block;">${emoji}</span>`
        + `<span style="font-size:10px;color:#6b5449;">${labels[i]}</span></a>`,
    )
    .join("");

  const detailUrl = buildDetailFeedbackUrl(baseUrl, matchId, userId);

  return `
    <div style="background:linear-gradient(135deg,#fff8f0,#fef0f5);border-radius:16px;padding:24px;margin-top:28px;text-align:center;border:1px solid #e8d5c8;">
      <p style="color:#2d1b14;font-size:16px;font-weight:600;margin:0 0 4px;">这个匹配你满意吗？</p>
      <p style="color:#6b5449;font-size:13px;margin:0 0 16px;">点击表情快速评分，你的反馈对我们非常重要</p>
      <div style="margin-bottom:16px;">${links}</div>
      <a href="${detailUrl}" style="display:inline-block;color:#8b2252;font-size:13px;text-decoration:underline;">想说更多？留下你的详细反馈 →</a>
    </div>`;
}

export async function sendMatchEmail(data: MatchEmailData) {
  if (process.env.NODE_ENV === "development") {
    console.log(`\n[Match Email] To: ${data.toEmail}`);
    console.log(`[Match Email] Partner: ${data.partnerEmail}`);
    console.log(`[Match Email] Compatibility: ${data.compatibility}%`);
    console.log(`[Match Email] Reasons: ${data.reasons.join(", ")}`);
    if (data.aiInsight) console.log(`[Match Email] AI Insight: ${data.aiInsight}`);
    console.log();
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
  const baseUrl = process.env.BETTER_AUTH_URL || "https://www.date-match.online";

  const { data: sentEmail, error } = await resend.emails.send({
    from,
    replyTo: replyTo || undefined,
    to: data.toEmail,
    subject: `✨ 本周匹配结果来啦 | ${data.week}`,
    tags: [{ name: "email_type", value: "match_result" }],
    html: `
      <div style="font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Georgia, serif; max-width: 520px; margin: 0 auto; padding: 40px 20px; background: #fdf6f0;">
        <h1 style="color: #8b2252; font-size: 28px; margin-bottom: 8px;">date match.</h1>
        <p style="color: #6b5449; font-size: 14px; margin-bottom: 32px;">第 ${data.week} 周 · 匹配结果</p>

        <div style="background: white; border-radius: 16px; padding: 28px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          <h2 style="color: #2d1b14; font-size: 22px; margin: 0 0 16px;">
            你的匹配对象：${data.partnerName || "一位特别的人"}
          </h2>
          <p style="margin: 6px 0; font-size: 15px; color: #6b5449;">📧 ${data.partnerEmail}</p>
          <div style="margin: 16px 0; text-align: center;">
            <span style="display: inline-block; background: linear-gradient(135deg, #8b2252, #c4536a); color: white; font-size: 28px; font-weight: 700; padding: 12px 28px; border-radius: 16px;">
              ${data.compatibility}%
            </span>
            <p style="color: #6b5449; font-size: 12px; margin: 6px 0 0;">契合度</p>
          </div>

          <h3 style="color: #2d1b14; font-size: 15px; margin: 20px 0 10px;">为什么匹配你们：</h3>
          <ul style="padding-left: 0; list-style: none; margin: 0;">
            ${data.reasons.map((r) => `<li style="margin: 8px 0; padding-left: 20px; position: relative; color: #6b5449; font-size: 14px; line-height: 1.6;"><span style="position: absolute; left: 0; color: #8b2252;">•</span>${r}</li>`).join("")}
          </ul>
        </div>

        ${buildAiInsightHtml(data.aiInsight)}

        <p style="color: #6b5449; font-size: 15px; line-height: 1.7;">
          迈出第一步吧——给对方发封邮件，约一杯咖啡，看看会碰撞出什么火花 ☕
        </p>

        ${buildFeedbackHtml(baseUrl, data.matchId, data.userId)}

        <p style="color: #b09080; font-size: 12px; margin-top: 32px; text-align: center;">
          Date Match — 不靠刷脸，靠灵魂找到你的人。
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
