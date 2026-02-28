/**
 * 匿名盲盒匹配 API
 *
 * GET  ?u=userId&t=hmacToken&w=2026-W09
 *   → 返回该用户本周的匿名匹配卡片列表
 *
 * POST { userId, token, matchId, score }
 *   → 提交评分 + mutual match 检测 + 自动揭示
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { verifyBlindDateToken } from "@/server/email/send-blind-date-invite";
import { sendMatchEmail } from "@/server/email/send-match";

const MUTUAL_THRESHOLD = 4;

// ─── Helpers ───

function bucketAge(age: number): string {
  if (age <= 0) return "未填写";
  if (age <= 22) return "18-22";
  if (age <= 25) return "22-25";
  if (age <= 28) return "25-28";
  return "28+";
}

interface AnonymousCard {
  matchId: string;
  compatibility: number;
  reasons: string[];
  aiInsight: string | null;
  myScore: number | null;
  profile: {
    ageRange: string;
    gender: string;
    educationLevel: string;
    schoolTier: string;
    surveyHighlights: Record<string, string>;
  };
}

const ANIMAL_LABELS: Record<string, string> = {
  A: "🦔 刺猬型（保护型）",
  B: "🐦 鸵鸟型（回避型）",
  C: "🐬 海豚型（沟通型）",
  D: "🐙 章鱼型（分析型）",
  E: "🦥 树懒型（深思型）",
};

const SAFETY_LABELS: Record<string, string> = {
  A: "事事有回应",
  B: "绝对的后盾",
  C: "自由的牵挂",
  D: "进步的战友",
};

function extractSurveyHighlights(answers: Record<string, unknown>): Record<string, string> {
  const highlights: Record<string, string> = {};

  const animal = answers.conflict_animal;
  if (typeof animal === "string" && ANIMAL_LABELS[animal]) {
    highlights["冲突风格"] = ANIMAL_LABELS[animal];
  }

  const safety = answers.safety_source;
  if (typeof safety === "string" && SAFETY_LABELS[safety]) {
    highlights["安全感来源"] = SAFETY_LABELS[safety];
  }

  if (typeof answers.intimacy_warmth === "number") {
    highlights["温存需求"] = `${answers.intimacy_warmth}/10`;
  }
  if (typeof answers.intimacy_passion === "number") {
    highlights["激情需求"] = `${answers.intimacy_passion}/10`;
  }

  if (typeof answers.attraction_points === "string" && answers.attraction_points) {
    highlights["吸引力说明书"] = answers.attraction_points as string;
  }
  if (typeof answers.relationship_food === "string" && answers.relationship_food) {
    highlights["关系食物比喻"] = answers.relationship_food as string;
  }
  if (typeof answers.core_principle === "string" && answers.core_principle) {
    highlights["核心原则"] = answers.core_principle as string;
  }

  return highlights;
}

// ─── GET: Fetch anonymous match cards ───

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const userId = sp.get("u");
  const token = sp.get("t");
  const week = sp.get("w");

  if (!userId || !token || !week) {
    return NextResponse.json({ error: "参数不完整" }, { status: 400 });
  }

  if (!verifyBlindDateToken(userId, token)) {
    return NextResponse.json({ error: "链接无效或已过期" }, { status: 403 });
  }

  // Find all anonymous matches for this user this week
  const matches = await db.match.findMany({
    where: {
      week,
      status: { in: ["anonymous", "revealed"] },
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      feedbacks: {
        where: { userId },
        select: { initialScore: true },
      },
    },
  });

  if (matches.length === 0) {
    return NextResponse.json({ cards: [], week });
  }

  // Collect partner user IDs
  const partnerIds = matches.map((m) =>
    m.user1Id === userId ? m.user2Id : m.user1Id,
  );

  // Batch load partner profiles + survey answers
  const [profiles, surveyResponses] = await Promise.all([
    db.profile.findMany({
      where: { userId: { in: partnerIds } },
      select: {
        userId: true,
        gender: true,
        age: true,
        education: true,
        schoolTier: true,
      },
    }),
    db.surveyResponse.findMany({
      where: { userId: { in: partnerIds } },
      select: { userId: true, answers: true },
    }),
  ]);

  const profileMap = new Map(profiles.map((p) => [p.userId, p]));
  const surveyMap = new Map(surveyResponses.map((s) => [s.userId, s]));

  const cards: AnonymousCard[] = matches.map((m) => {
    const partnerId = m.user1Id === userId ? m.user2Id : m.user1Id;
    const profile = profileMap.get(partnerId);
    const survey = surveyMap.get(partnerId);

    let surveyHighlights: Record<string, string> = {};
    if (survey) {
      try {
        const answers = JSON.parse(survey.answers) as Record<string, unknown>;
        surveyHighlights = extractSurveyHighlights(answers);
      } catch { /* skip */ }
    }

    return {
      matchId: m.id,
      compatibility: m.compatibility,
      reasons: JSON.parse(m.reasons) as string[],
      aiInsight: m.aiInsight,
      status: m.status,
      myScore: m.feedbacks[0]?.initialScore ?? null,
      profile: {
        ageRange: profile ? bucketAge(profile.age) : "未填写",
        gender: profile?.gender ?? "未填写",
        educationLevel: profile?.education ?? "未填写",
        schoolTier: profile?.schoolTier ?? "未填写",
        surveyHighlights,
      },
    };
  });

  // Sort: unrated first, then by compatibility desc
  cards.sort((a, b) => {
    if (a.myScore === null && b.myScore !== null) return -1;
    if (a.myScore !== null && b.myScore === null) return 1;
    return b.compatibility - a.compatibility;
  });

  return NextResponse.json({ cards, week });
}

// ─── POST: Submit rating + mutual match detection ───

export async function POST(request: NextRequest) {
  let body: { userId?: string; token?: string; matchId?: string; score?: number };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, token, matchId, score } = body;
  if (!userId || !token || !matchId || typeof score !== "number") {
    return NextResponse.json({ error: "参数不完整" }, { status: 400 });
  }

  if (!verifyBlindDateToken(userId, token)) {
    return NextResponse.json({ error: "链接无效" }, { status: 403 });
  }

  if (score < 1 || score > 5) {
    return NextResponse.json({ error: "评分范围 1-5" }, { status: 400 });
  }

  // Verify this match belongs to the user
  const match = await db.match.findUnique({
    where: { id: matchId },
    include: { feedbacks: true },
  });

  if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
    return NextResponse.json({ error: "匹配不存在" }, { status: 404 });
  }

  // Upsert feedback
  await db.matchFeedback.upsert({
    where: { matchId_userId: { matchId, userId } },
    update: { initialScore: score },
    create: { matchId, userId, initialScore: score },
  });

  // Check mutual match
  const partnerId = match.user1Id === userId ? match.user2Id : match.user1Id;
  const partnerFeedback = match.feedbacks.find((f) => f.userId === partnerId);

  let mutual = false;
  if (
    match.status === "anonymous" &&
    score >= MUTUAL_THRESHOLD &&
    partnerFeedback?.initialScore != null &&
    partnerFeedback.initialScore >= MUTUAL_THRESHOLD
  ) {
    mutual = true;

    await db.match.update({
      where: { id: matchId },
      data: { status: "revealed" },
    });

    // Send reveal emails to both users
    const [user1, user2] = await Promise.all([
      db.user.findUnique({ where: { id: match.user1Id } }),
      db.user.findUnique({ where: { id: match.user2Id } }),
    ]);

    if (user1 && user2) {
      const reasons = JSON.parse(match.reasons) as string[];
      await Promise.all([
        sendMatchEmail({
          matchId: match.id,
          userId: match.user1Id,
          toEmail: user1.email,
          partnerEmail: user2.email,
          partnerName: user2.name,
          compatibility: match.compatibility,
          reasons,
          week: match.week,
          aiInsight: match.aiInsight ?? undefined,
        }),
        sendMatchEmail({
          matchId: match.id,
          userId: match.user2Id,
          toEmail: user2.email,
          partnerEmail: user1.email,
          partnerName: user1.name,
          compatibility: match.compatibility,
          reasons,
          week: match.week,
          aiInsight: match.aiInsight ?? undefined,
        }),
      ]);
    }
  }

  return NextResponse.json({
    success: true,
    score,
    mutual,
    message: mutual
      ? "双向奔赴！对方也对你感兴趣，匹配详情已发送到你们的邮箱 ✨"
      : "评分已记录，感谢你的反馈！",
  });
}
