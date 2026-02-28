export interface ConfirmationEmailData {
  toEmail: string;
  displayName: string;
  verifyUrl: string;
}

export async function sendConfirmationEmail(data: ConfirmationEmailData) {
  if (process.env.NODE_ENV === "development") {
    console.log(`\n[Confirmation Email] To: ${data.toEmail}`);
    console.log(`[Confirmation Email] Name: ${data.displayName}`);
    console.log(`[Confirmation Email] Verify: ${data.verifyUrl}\n`);
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
    subject: "验证你的邮箱 — Date Match",
    tags: [{ name: "email_type", value: "verification" }],
    html: `
      <div style="font-family: Georgia, 'Noto Serif SC', serif; max-width: 520px; margin: 0 auto; padding: 40px 20px; background: #fdf6f0;">
        <h1 style="color: #8b2252; font-size: 28px; margin-bottom: 8px;">date match.</h1>
        <p style="color: #6b5449; font-size: 14px; margin-bottom: 32px;">关系基因匹配测试</p>

        <div style="background: white; border-radius: 16px; padding: 28px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          <h2 style="color: #2d1b14; font-size: 20px; margin: 0 0 16px;">
            ${data.displayName}，你的问卷已收到！
          </h2>
          <p style="color: #6b5449; font-size: 15px; line-height: 1.8; margin: 0 0 24px;">
            点击下方按钮验证你的邮箱，验证后才能参与每周匹配。
          </p>
          <div style="text-align: center; margin: 0 0 24px;">
            <a href="${data.verifyUrl}" style="display: inline-block; background: #8b2252; color: white; padding: 14px 40px; border-radius: 9999px; text-decoration: none; font-size: 16px; font-weight: bold;">
              验证邮箱
            </a>
          </div>
          <p style="color: #a89488; font-size: 12px; text-align: center; margin: 0;">
            链接 24 小时内有效
          </p>
        </div>

        <div style="background: white; border-radius: 16px; padding: 28px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          <p style="color: #6b5449; font-size: 15px; line-height: 1.8; margin: 0 0 20px;">
            验证完成后，接下来会这样进行：
          </p>
          <div style="margin: 0; padding: 0;">
            <div style="display: flex; margin-bottom: 16px;">
              <span style="color: #8b2252; font-size: 20px; margin-right: 12px;">1.</span>
              <div>
                <p style="margin: 0; color: #2d1b14; font-size: 15px; font-weight: bold;">算法匹配</p>
                <p style="margin: 4px 0 0; color: #6b5449; font-size: 14px;">我们会在每周匹配轮次中为你寻找最契合的对象</p>
              </div>
            </div>
            <div style="display: flex; margin-bottom: 16px;">
              <span style="color: #8b2252; font-size: 20px; margin-right: 12px;">2.</span>
              <div>
                <p style="margin: 0; color: #2d1b14; font-size: 15px; font-weight: bold;">邮件通知</p>
                <p style="margin: 4px 0 0; color: #6b5449; font-size: 14px;">匹配成功后，你会收到一封包含对方信息和匹配原因的邮件</p>
              </div>
            </div>
            <div style="display: flex;">
              <span style="color: #8b2252; font-size: 20px; margin-right: 12px;">3.</span>
              <div>
                <p style="margin: 0; color: #2d1b14; font-size: 15px; font-weight: bold;">开始联系</p>
                <p style="margin: 4px 0 0; color: #6b5449; font-size: 14px;">收到匹配结果后，主动迈出第一步吧</p>
              </div>
            </div>
          </div>
        </div>

        <p style="color: #6b5449; font-size: 13px; line-height: 1.6;">
          如果你有任何问题，直接回复这封邮件即可。
        </p>

        <p style="color: #a89488; font-size: 12px; margin-top: 32px;">
          Date Match — 不靠滑动，找到对的人。
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
