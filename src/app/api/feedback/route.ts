import crypto from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/server/db";

function verifyToken(matchId: string, userId: string, token: string): boolean {
  const secret = process.env.BETTER_AUTH_SECRET || "";
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${matchId}:${userId}`)
    .digest("hex")
    .slice(0, 16);
  return expected === token;
}

export function createFeedbackToken(matchId: string, userId: string): string {
  const secret = process.env.BETTER_AUTH_SECRET || "";
  return crypto
    .createHmac("sha256", secret)
    .update(`${matchId}:${userId}`)
    .digest("hex")
    .slice(0, 16);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const matchId = url.searchParams.get("m");
  const userId = url.searchParams.get("u");
  const score = url.searchParams.get("s");
  const token = url.searchParams.get("t");

  if (!matchId || !userId || !score || !token) {
    return new NextResponse("参数不完整", { status: 400 });
  }

  if (!verifyToken(matchId, userId, token)) {
    return new NextResponse("链接无效或已过期", { status: 403 });
  }

  const scoreNum = parseInt(score, 10);
  if (scoreNum < 1 || scoreNum > 5) {
    return new NextResponse("评分范围 1-5", { status: 400 });
  }

  await db.matchFeedback.upsert({
    where: { matchId_userId: { matchId, userId } },
    update: { initialScore: scoreNum },
    create: { matchId, userId, initialScore: scoreNum },
  });

  const emoji = ["", "😟", "😐", "🙂", "😊", "🥰"][scoreNum];
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="zh">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>感谢反馈</title>
<style>
  body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;
    min-height:100vh;margin:0;background:#fdf6f0;color:#2d1b14;}
  .card{text-align:center;padding:48px 32px;background:white;border-radius:20px;
    box-shadow:0 4px 12px rgba(0,0,0,.06);max-width:360px;}
  .emoji{font-size:64px;margin-bottom:16px;}
  h1{font-size:22px;margin:0 0 8px;color:#8b2252;}
  p{color:#6b5449;font-size:15px;line-height:1.6;}
</style></head>
<body><div class="card">
  <div class="emoji">${emoji}</div>
  <h1>谢谢你的反馈！</h1>
  <p>你给本次匹配打了 ${scoreNum} 分。<br>你的评价将帮助我们为你找到更合适的人。</p>
</div></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
