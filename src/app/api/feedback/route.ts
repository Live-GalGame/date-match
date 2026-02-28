import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { createFeedbackToken } from "@/server/email/send-match";

function verifyToken(matchId: string, userId: string, token: string): boolean {
  return createFeedbackToken(matchId, userId) === token;
}

// GET: quick emoji rating from email → record score → redirect to detail page
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

  const baseUrl = process.env.BETTER_AUTH_URL || "https://www.date-match.online";
  const redirectUrl = `${baseUrl}/feedback?m=${matchId}&u=${userId}&t=${token}&saved=${scoreNum}`;
  return NextResponse.redirect(redirectUrl, 302);
}

// POST: detailed feedback (issues, comment, wantRematch)
export async function POST(req: Request) {
  let body: {
    matchId?: string;
    userId?: string;
    token?: string;
    score?: number;
    issues?: string[];
    comment?: string;
    wantRematch?: boolean;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { matchId, userId, token, score, issues, comment, wantRematch } = body;
  if (!matchId || !userId || !token) {
    return NextResponse.json({ error: "参数不完整" }, { status: 400 });
  }

  if (!verifyToken(matchId, userId, token)) {
    return NextResponse.json({ error: "链接无效" }, { status: 403 });
  }

  const match = await db.match.findUnique({ where: { id: matchId } });
  if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
    return NextResponse.json({ error: "匹配不存在" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (typeof score === "number" && score >= 1 && score <= 5) {
    updateData.initialScore = score;
  }
  if (Array.isArray(issues)) {
    updateData.issues = JSON.stringify(issues);
  }
  if (typeof comment === "string") {
    updateData.status = wantRematch ? "want_rematch" : "feedback_submitted";
  }

  await db.matchFeedback.upsert({
    where: { matchId_userId: { matchId, userId } },
    update: updateData,
    create: {
      matchId,
      userId,
      initialScore: typeof score === "number" ? score : null,
      issues: Array.isArray(issues) ? JSON.stringify(issues) : "[]",
      status: wantRematch ? "want_rematch" : (comment ? "feedback_submitted" : null),
    },
  });

  return NextResponse.json({ success: true });
}
