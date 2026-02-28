import { NextResponse } from "next/server";
import { db } from "@/server/db";
import {
  runMatchingRound,
  createMatchingContext,
  type ProfileData,
  type MatchResult,
} from "@/server/matching/algorithm";
import { sendMatchEmail } from "@/server/email/send-match";
import { sendBlindDateInvite } from "@/server/email/send-blind-date-invite";
import { generateMatchInsight } from "@/server/llm/generate-insight";
import { getSurveyVersion } from "@/lib/survey-questions";

function getCurrentWeek(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7
  );
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function parseSurveyVersionId(answers: string): string {
  try {
    const parsed = JSON.parse(answers);
    return typeof parsed._surveyVersion === "string" ? parsed._surveyVersion : "v2";
  } catch {
    return "v2";
  }
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.BETTER_AUTH_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") === "true";
  const mode = url.searchParams.get("mode") === "anonymous" ? "anonymous" as const : "normal" as const;
  const anonymousLimit = mode === "anonymous" ? 5 : undefined;

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

  // Group surveys by version into pools
  // "v3-lite+v2" users participate in both pools (they answered both sets of questions)
  const versionPools = new Map<string, typeof surveys>();
  for (const s of surveys) {
    const versionStr = parseSurveyVersionId(s.answers);
    const versions = versionStr.includes("+") ? versionStr.split("+") : [versionStr];
    for (const v of versions) {
      if (!getSurveyVersion(v)) continue;
      if (!versionPools.has(v)) versionPools.set(v, []);
      versionPools.get(v)!.push(s);
    }
  }

  // Stage 1: 按版本分池匹配（大池优先），跨池去重已匹配用户
  const allResults: MatchResult[] = [];
  const matchedUsers = new Set<string>();
  const poolStats: Record<string, { eligible: number; matched: number }> = {};

  const sortedPools = [...versionPools.entries()].sort(
    (a, b) => b[1].length - a[1].length,
  );

  for (const [vId, poolSurveys] of sortedPools) {
    const available = poolSurveys.filter((s) => !matchedUsers.has(s.userId));
    const ctx = createMatchingContext(vId);
    const results = runMatchingRound(available, profileMap, ctx,
      anonymousLimit ? { overrideMatchLimit: anonymousLimit } : undefined,
    );

    poolStats[vId] = { eligible: available.length, matched: results.length * 2 };

    for (const r of results) {
      matchedUsers.add(r.user1Id);
      matchedUsers.add(r.user2Id);
      allResults.push(r);
    }
  }

  // Stage 2: 落库 + 可选 LLM/邮件
  const surveyMap = new Map(surveys.map((s) => [s.userId, s]));
  let llmSuccess = 0;
  let matchesCreated = 0;

  for (const result of allResults) {
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
        status: mode === "anonymous" ? "anonymous" : "revealed",
      },
    });
    matchesCreated++;

    // dryRun: 只落库，跳过 LLM 和邮件
    if (dryRun) continue;

    // LLM insight generation (both modes benefit from AI narrative)
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

    // Anonymous mode: skip direct match emails (blind-date invites sent in batch below)
    if (mode === "anonymous") continue;

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

  // Anonymous mode: send one notification email per user (not per match)
  let blindInvitesSent = 0;
  if (mode === "anonymous" && !dryRun && matchesCreated > 0) {
    const matchedUserIds = new Set<string>();
    for (const r of allResults) {
      matchedUserIds.add(r.user1Id);
      matchedUserIds.add(r.user2Id);
    }

    const usersToNotify = await db.user.findMany({
      where: { id: { in: [...matchedUserIds] } },
      select: { id: true, email: true, name: true },
    });

    // Count matches per user for the email copy
    const matchCountByUser = new Map<string, number>();
    for (const r of allResults) {
      matchCountByUser.set(r.user1Id, (matchCountByUser.get(r.user1Id) ?? 0) + 1);
      matchCountByUser.set(r.user2Id, (matchCountByUser.get(r.user2Id) ?? 0) + 1);
    }

    for (const u of usersToNotify) {
      try {
        await sendBlindDateInvite({
          userId: u.id,
          toEmail: u.email,
          displayName: u.name,
          matchCount: matchCountByUser.get(u.id) ?? 0,
          week,
        });
        blindInvitesSent++;
      } catch (err) {
        console.error(`[BlindDate] Email failed for ${u.id}:`, err);
      }
    }
  }

  return NextResponse.json({
    week,
    mode,
    dryRun,
    matchesCreated,
    llmInsightsGenerated: llmSuccess,
    blindInvitesSent,
    poolStats,
    totalEligible: surveys.length,
  });
}
