import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

type JsonObject = Record<string, unknown>;

function assert(condition: unknown, msg: string): asserts condition {
  if (!condition) throw new Error(msg);
}

function safeJsonParse(input: string): JsonObject {
  try {
    const v = JSON.parse(input) as unknown;
    if (v && typeof v === "object" && !Array.isArray(v)) return v as JsonObject;
    return {};
  } catch {
    return {};
  }
}

function pct(n: number, d: number) {
  if (d === 0) return "0.00%";
  return `${((n / d) * 100).toFixed(2)}%`;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function hasAnswer(v: unknown) {
  if (isNumber(v)) return true;
  if (isNonEmptyString(v)) return true;
  if (isStringArray(v)) return v.length > 0;
  return false;
}

async function main() {
  const envPath = process.env.DOTENV_CONFIG_PATH;
  assert(process.env.DATABASE_URL, "DATABASE_URL missing. Set it or load via dotenv.");

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter });
  await db.$connect();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasUserDelegate = typeof (db as any).user?.count === "function";
  if (!hasUserDelegate) {
    throw new Error(
      "PrismaClient model delegates missing (db.user undefined). " +
        "This usually means Prisma runtime artifacts are not generated/available.",
    );
  }

  const [
    userCount,
    userEmailVerifiedCount,
    profileCount,
    surveyCount,
    surveyCompletedCount,
    surveyOptedInCount,
    eligibleForMatchingCount,
    matchCount,
    feedbackCount,
    feedbackWithInitialScoreCount,
    feedbackWithStatusCount,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { emailVerified: true } }),
    db.profile.count(),
    db.surveyResponse.count(),
    db.surveyResponse.count({ where: { completed: true } }),
    db.surveyResponse.count({ where: { optedIn: true } }),
    db.surveyResponse.count({
      where: {
        completed: true,
        optedIn: true,
        user: { emailVerified: true },
      },
    }),
    db.match.count(),
    db.matchFeedback.count(),
    db.matchFeedback.count({ where: { initialScore: { not: null } } }),
    db.matchFeedback.count({ where: { status: { not: null } } }),
  ]);

  console.log("=== Production data audit (aggregates only) ===");
  if (envPath) console.log(`dotenv path: ${envPath}`);
  console.log(`User: ${userCount}`);
  console.log(`User.emailVerified: ${userEmailVerifiedCount} (${pct(userEmailVerifiedCount, userCount)})`);
  console.log(`Profile: ${profileCount}`);
  console.log(`SurveyResponse: ${surveyCount}`);
  console.log(`SurveyResponse.completed: ${surveyCompletedCount} (${pct(surveyCompletedCount, surveyCount)})`);
  console.log(`SurveyResponse.optedIn: ${surveyOptedInCount} (${pct(surveyOptedInCount, surveyCount)})`);
  console.log(
    `Eligible for matching (completed+optedIn+emailVerified): ${eligibleForMatchingCount} (${pct(eligibleForMatchingCount, surveyCount)})`,
  );
  console.log(`Match: ${matchCount}`);
  console.log(`MatchFeedback rows: ${feedbackCount}`);
  console.log(
    `MatchFeedback.initialScore!=null: ${feedbackWithInitialScoreCount} (${pct(feedbackWithInitialScoreCount, feedbackCount)})`,
  );
  console.log(`MatchFeedback.status!=null: ${feedbackWithStatusCount} (${pct(feedbackWithStatusCount, feedbackCount)})`);

  // --- Survey version distribution + answer missingness (sampled/batched to avoid huge memory) ---
  const take = 500;
  let cursor: { id: string } | undefined;
  let scanned = 0;

  const versionCounts = new Map<string, number>();
  const versionCountsEligible = new Map<string, number>();
  const questionSeen = new Map<string, number>(); // questionId -> rows where key exists
  const questionAnswered = new Map<string, number>(); // questionId -> rows where hasAnswer(value)

  while (true) {
    const rows = await db.surveyResponse.findMany({
      select: { id: true, answers: true, completed: true, optedIn: true },
      orderBy: { id: "asc" },
      take,
      ...(cursor ? { cursor, skip: 1 } : {}),
    });

    if (rows.length === 0) break;
    for (const r of rows) {
      scanned++;
      const ans = safeJsonParse(r.answers);
      const v = typeof ans._surveyVersion === "string" ? ans._surveyVersion : "unknown";
      versionCounts.set(v, (versionCounts.get(v) ?? 0) + 1);
      if (r.completed && r.optedIn) {
        // Note: we don't join user.emailVerified in this scan (to keep it fast).
        // We'll approximate "eligible" by completed+optedIn here and rely on the exact DB count above.
        versionCountsEligible.set(v, (versionCountsEligible.get(v) ?? 0) + 1);
      }

      for (const [k, val] of Object.entries(ans)) {
        if (k.startsWith("_")) continue;
        questionSeen.set(k, (questionSeen.get(k) ?? 0) + 1);
        if (hasAnswer(val)) questionAnswered.set(k, (questionAnswered.get(k) ?? 0) + 1);
      }
    }

    cursor = { id: rows[rows.length - 1]!.id };
  }

  console.log("");
  console.log(`SurveyResponse scanned for answers: ${scanned}`);
  console.log("Survey version distribution:");
  const vSorted = [...versionCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [v, c] of vSorted) {
    console.log(`- ${v}: ${c} (${pct(c, scanned)})`);
  }

  console.log("");
  console.log("Survey version distribution (completed+optedIn only):");
  const veSorted = [...versionCountsEligible.entries()].sort((a, b) => b[1] - a[1]);
  for (const [v, c] of veSorted) {
    console.log(`- ${v}: ${c} (${pct(c, scanned)})`);
  }

  console.log("");
  console.log("Top 30 questionIds by coverage (answered / seen):");
  const qSorted = [...questionSeen.entries()]
    .map(([qid, seen]) => ({
      qid,
      seen,
      answered: questionAnswered.get(qid) ?? 0,
    }))
    .sort((a, b) => b.seen - a.seen)
    .slice(0, 30);

  for (const q of qSorted) {
    console.log(`- ${q.qid}: answered ${q.answered}/${q.seen} (${pct(q.answered, q.seen)})`);
  }

  // --- Feedback distributions (small, safe aggregates) ---
  console.log("");
  console.log("MatchFeedback initialScore distribution:");
  const scoreGroups = await db.matchFeedback.groupBy({
    by: ["initialScore"],
    _count: { _all: true },
    where: { initialScore: { not: null } },
    orderBy: { initialScore: "asc" },
  });
  for (const g of scoreGroups) {
    console.log(`- ${g.initialScore}: ${g._count._all}`);
  }

  console.log("");
  console.log("MatchFeedback status distribution:");
  const statusGroups = await db.matchFeedback.groupBy({
    by: ["status"],
    _count: { _all: true },
    where: { status: { not: null } },
    orderBy: { status: "asc" },
  });
  for (const g of statusGroups) {
    console.log(`- ${g.status}: ${g._count._all}`);
  }

  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

