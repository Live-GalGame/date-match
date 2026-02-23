import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { runMatchingRound } from "@/server/matching/algorithm";
import { sendMatchEmail } from "@/server/email/send-match";

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
  const surveys = await db.surveyResponse.findMany({
    where: {
      completed: true,
      optedIn: true,
      user: { emailVerified: true },
    },
  });

  const results = runMatchingRound(surveys);

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

    await db.match.create({
      data: {
        user1Id: result.user1Id,
        user2Id: result.user2Id,
        compatibility: result.compatibility,
        reasons: JSON.stringify(result.reasons),
        week,
      },
    });

    const [user1, user2] = await Promise.all([
      db.user.findUnique({ where: { id: result.user1Id } }),
      db.user.findUnique({ where: { id: result.user2Id } }),
    ]);

    if (user1 && user2) {
      await Promise.all([
        sendMatchEmail({
          toEmail: user1.email,
          partnerEmail: user2.email,
          partnerName: user2.name,
          compatibility: result.compatibility,
          reasons: result.reasons,
          week,
        }),
        sendMatchEmail({
          toEmail: user2.email,
          partnerEmail: user1.email,
          partnerName: user1.name,
          compatibility: result.compatibility,
          reasons: result.reasons,
          week,
        }),
      ]);
    }
  }

  return NextResponse.json({
    week,
    matchesCreated: results.length,
  });
}
