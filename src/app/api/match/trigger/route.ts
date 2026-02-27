import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { runMatchingRound, type ProfileData } from "@/server/matching/algorithm";
import { sendMatchEmail } from "@/server/email/send-match";
import { generateMatchInsight } from "@/server/llm/generate-insight";

function getCurrentWeek(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7
  );
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.BETTER_AUTH_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const week = getCurrentWeek();

  // Stage 0: 加载问卷 + Profile（含 deal-breaker）
  const [surveys, profileRows] = await Promise.all([
    db.surveyResponse.findMany({
      where: {
        completed: true,
        optedIn: true,
        user: { emailVerified: true },
      },
    }),
    db.profile.findMany({
      select: { userId: true, traits: true, dealBreakers: true },
    }),
  ]);

  const profileMap = new Map<string, ProfileData>();
  for (const p of profileRows) {
    profileMap.set(p.userId, {
      traits: JSON.parse(p.traits) as string[],
      dealBreakers: JSON.parse(p.dealBreakers) as string[],
    });
  }

  // Stage 1: 规则引擎初筛（心理学矩阵 + deal-breaker 硬过滤 + 全局最大权匹配）
  const results = runMatchingRound(surveys, profileMap);

  const surveyMap = new Map(surveys.map((s) => [s.userId, s]));
  let llmSuccess = 0;

  for (const result of results) {
    const existing = await db.match.findUnique({
      where: {
        user1Id_user2Id_week: {
          user1Id: result.user1Id,
          user2Id: result.user2Id,
          week,
        },
      },
    });
    if (existing) continue;

    const match = await db.match.create({
      data: {
        user1Id: result.user1Id,
        user2Id: result.user2Id,
        compatibility: result.compatibility,
        reasons: JSON.stringify(result.reasons),
        week,
      },
    });

    // Stage 2: LLM 精筛 — 为规则匹配的结果生成 AI 牵线文案
    let aiInsight: string | undefined;
    try {
      const s1 = surveyMap.get(result.user1Id);
      const s2 = surveyMap.get(result.user2Id);
      if (s1 && s2) {
        const a1 = JSON.parse(s1.answers) as Record<string, string | number | string[]>;
        const a2 = JSON.parse(s2.answers) as Record<string, string | number | string[]>;
        const insight = await generateMatchInsight(a1, a2, result);
        if (insight) {
          aiInsight = `${insight.narrative}\n\n💡 破冰话题：${insight.icebreaker}`;
          await db.match.update({
            where: { id: match.id },
            data: { aiInsight },
          });
          llmSuccess++;
        }
      }
    } catch (err) {
      console.error(`[LLM] Failed for match ${match.id}:`, err);
    }

    const [user1, user2] = await Promise.all([
      db.user.findUnique({ where: { id: result.user1Id } }),
      db.user.findUnique({ where: { id: result.user2Id } }),
    ]);

    if (user1 && user2) {
      await Promise.all([
        sendMatchEmail({
          matchId: match.id,
          userId: result.user1Id,
          toEmail: user1.email,
          partnerEmail: user2.email,
          partnerName: user2.name,
          compatibility: result.compatibility,
          reasons: result.reasons,
          week,
          aiInsight,
        }),
        sendMatchEmail({
          matchId: match.id,
          userId: result.user2Id,
          toEmail: user2.email,
          partnerEmail: user1.email,
          partnerName: user1.name,
          compatibility: result.compatibility,
          reasons: result.reasons,
          week,
          aiInsight,
        }),
      ]);
    }
  }

  return NextResponse.json({
    week,
    matchesCreated: results.length,
    llmInsightsGenerated: llmSuccess,
  });
}
