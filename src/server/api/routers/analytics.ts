import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { v2Deep, v3Lite } from "@/lib/survey-questions";
import type { SurveyVersion, SurveyQuestion } from "@/lib/survey-versions/types";

type Answers = Record<string, unknown>;

const versionDefs: Record<string, SurveyVersion> = {
  v2: v2Deep,
  "v3-lite": v3Lite,
};

interface OptionStat {
  value: string;
  label: string;
  count: number;
}

interface QuestionStat {
  id: string;
  question: string;
  type: string;
  totalResponses: number;
  options: OptionStat[];
  textResponses?: string[];
}

function aggregateQuestion(
  q: SurveyQuestion,
  allAnswers: Answers[],
): QuestionStat {
  const raw = allAnswers
    .map((a) => a[q.id])
    .filter((v) => v !== undefined && v !== null && v !== "");

  const totalResponses = raw.length;

  if (q.type === "single") {
    const counts: Record<string, number> = {};
    for (const opt of q.options) counts[opt.value] = 0;
    for (const v of raw) {
      const key = String(v);
      if (key in counts) counts[key]++;
    }
    return {
      id: q.id,
      question: q.question,
      type: q.type,
      totalResponses,
      options: q.options.map((opt) => ({
        value: opt.value,
        label: opt.label,
        count: counts[opt.value] ?? 0,
      })),
    };
  }

  if (q.type === "tags") {
    const counts: Record<string, number> = {};
    for (const opt of q.options) counts[opt] = 0;
    for (const v of raw) {
      const arr = Array.isArray(v) ? v : [];
      for (const tag of arr) {
        if (typeof tag === "string" && tag in counts) counts[tag]++;
      }
    }
    return {
      id: q.id,
      question: q.question,
      type: q.type,
      totalResponses,
      options: q.options.map((opt) => ({
        value: opt,
        label: opt,
        count: counts[opt] ?? 0,
      })),
    };
  }

  if (q.type === "ranking") {
    const counts: Record<string, number> = {};
    for (const opt of q.options) counts[opt] = 0;
    for (const v of raw) {
      const arr = Array.isArray(v) ? v : [];
      for (const item of arr) {
        if (typeof item === "string" && item in counts) counts[item]++;
      }
    }
    return {
      id: q.id,
      question: q.question,
      type: q.type,
      totalResponses,
      options: q.options.map((opt) => ({
        value: opt,
        label: opt,
        count: counts[opt] ?? 0,
      })),
    };
  }

  if (q.type === "slider") {
    const counts: Record<number, number> = {};
    for (let i = q.min; i <= q.max; i += q.step ?? 1) counts[i] = 0;
    for (const v of raw) {
      const num = Number(v);
      if (!isNaN(num) && num in counts) counts[num]++;
    }
    const steps = Object.keys(counts)
      .map(Number)
      .sort((a, b) => a - b);
    return {
      id: q.id,
      question: q.question,
      type: q.type,
      totalResponses,
      options: steps.map((n) => ({
        value: String(n),
        label: `${n}${q.unit ?? ""}`,
        count: counts[n] ?? 0,
      })),
    };
  }

  // open_text — return all text responses
  return {
    id: q.id,
    question: q.question,
    type: q.type,
    totalResponses,
    options: [],
    textResponses: raw.map((v) => String(v)),
  };
}

function countField(values: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const v of values) {
    const key = v || "(空)";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function formatAnswer(q: SurveyQuestion, raw: unknown): string {
  if (raw === undefined || raw === null || raw === "") return "(未作答)";

  switch (q.type) {
    case "slider":
      return `${raw}${q.unit ?? ""}`;
    case "single": {
      const opt = q.options.find((o) => o.value === String(raw));
      return opt ? opt.label : String(raw);
    }
    case "tags":
      return Array.isArray(raw) ? raw.join("、") : String(raw);
    case "ranking":
      return Array.isArray(raw)
        ? raw.map((item, i) => `${i + 1}. ${item}`).join("\n")
        : String(raw);
    case "open_text":
      return String(raw);
    default:
      return String(raw);
  }
}

export const analyticsRouter = createTRPCRouter({
  getUserDetail: publicProcedure
    .input(z.object({ token: z.string(), email: z.string() }))
    .query(async ({ ctx, input }) => {
      const expectedToken =
        process.env.METRICS_DASHBOARD_TOKEN?.trim() ??
        process.env.BETTER_AUTH_SECRET?.trim() ??
        "";
      if (!expectedToken || input.token.trim() !== expectedToken) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "无效的访问令牌" });
      }

      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
        select: {
          email: true,
          name: true,
          emailVerified: true,
          referralCode: true,
          createdAt: true,
          profile: {
            select: {
              displayName: true,
              gender: true,
              datingPreference: true,
              age: true,
              school: true,
              education: true,
              schoolTier: true,
            },
          },
          surveyResponse: {
            select: { answers: true, completed: true, optedIn: true },
          },
        },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "用户不存在" });
      }

      let surveyVersion = "";
      let parsedAnswers: Answers = {};
      if (user.surveyResponse?.answers) {
        try {
          parsedAnswers = JSON.parse(user.surveyResponse.answers);
          surveyVersion = String(parsedAnswers._surveyVersion ?? "v2");
        } catch {}
      }

      const def = versionDefs[surveyVersion];
      const sections = def
        ? def.sections.map((section) => ({
            title: section.title,
            description: section.description,
            questions: section.questions.map((q) => ({
              id: q.id,
              question: q.question,
              type: q.type,
              note: q.note ?? null,
              rawAnswer: parsedAnswers[q.id] ?? null,
              formattedAnswer: formatAnswer(q, parsedAnswers[q.id]),
            })),
          }))
        : [];

      return {
        email: user.email,
        name: user.name ?? "",
        emailVerified: user.emailVerified,
        referralCode: user.referralCode ?? "",
        createdAt: user.createdAt.toISOString(),
        profile: user.profile
          ? {
              displayName: user.profile.displayName,
              gender: user.profile.gender,
              datingPreference: user.profile.datingPreference,
              age: user.profile.age,
              school: user.profile.school,
              education: user.profile.education,
              schoolTier: user.profile.schoolTier,
            }
          : null,
        surveyVersion,
        completed: user.surveyResponse?.completed ?? false,
        optedIn: user.surveyResponse?.optedIn ?? false,
        sections,
      };
    }),

  getStats: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const expectedToken =
        process.env.METRICS_DASHBOARD_TOKEN?.trim() ??
        process.env.BETTER_AUTH_SECRET?.trim() ??
        "";
      const incomingToken = input.token.trim();

      if (!expectedToken || incomingToken !== expectedToken) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "无效的访问令牌" });
      }

      const [responses, profiles, helicopterPilots, users] = await Promise.all([
        ctx.db.surveyResponse.findMany({
          where: { completed: true },
          select: { answers: true },
        }),
        ctx.db.profile.findMany({
          select: {
            gender: true,
            datingPreference: true,
            education: true,
            schoolTier: true,
          },
        }),
        ctx.db.helicopterPilot.findMany({
          select: { displayName: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.user.findMany({
          select: {
            email: true,
            name: true,
            emailVerified: true,
            referralCode: true,
            createdAt: true,
            profile: {
              select: {
                gender: true,
                datingPreference: true,
                education: true,
                schoolTier: true,
              },
            },
            surveyResponse: {
              select: { completed: true, optedIn: true, answers: true },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      const profileStats = {
        gender: countField(profiles.map((p) => p.gender)),
        datingPreference: countField(profiles.map((p) => p.datingPreference)),
        education: countField(profiles.map((p) => p.education)),
        schoolTier: countField(profiles.map((p) => p.schoolTier)),
      };

      const buckets: Record<string, Answers[]> = {};
      for (const r of responses) {
        const parsed: Answers = JSON.parse(r.answers);
        const ver = String(parsed._surveyVersion ?? "v2");
        if (!buckets[ver]) buckets[ver] = [];
        buckets[ver]!.push(parsed);
      }

      const versionStats: Record<
        string,
        { count: number; sections: { title: string; questions: QuestionStat[] }[] }
      > = {};

      for (const [verId, def] of Object.entries(versionDefs)) {
        const answers = buckets[verId] ?? [];
        versionStats[verId] = {
          count: answers.length,
          sections: def.sections.map((section) => ({
            title: section.title,
            questions: section.questions.map((q) =>
              aggregateQuestion(q, answers),
            ),
          })),
        };
      }

      const userList = users.map((u) => {
        let surveyVersion = "";
        if (u.surveyResponse?.answers) {
          try {
            const parsed = JSON.parse(u.surveyResponse.answers);
            surveyVersion = String(parsed._surveyVersion ?? "");
          } catch {}
        }
        return {
          email: u.email,
          name: u.name ?? "",
          emailVerified: u.emailVerified,
          gender: u.profile?.gender ?? "",
          datingPreference: u.profile?.datingPreference ?? "",
          education: u.profile?.education ?? "",
          schoolTier: u.profile?.schoolTier ?? "",
          surveyVersion,
          completed: u.surveyResponse?.completed ?? false,
          optedIn: u.surveyResponse?.optedIn ?? false,
          referralCode: u.referralCode ?? "",
          createdAt: u.createdAt.toISOString(),
        };
      });

      const referralStats: Record<string, { total: number; verified: number }> = {};
      for (const u of users) {
        const code = u.referralCode || "";
        if (!code) continue;
        if (!referralStats[code]) referralStats[code] = { total: 0, verified: 0 };
        referralStats[code]!.total++;
        if (u.emailVerified) referralStats[code]!.verified++;
      }

      return {
        totalResponses: responses.length,
        totalProfiles: profiles.length,
        profileStats,
        versionStats,
        helicopterPilots: {
          count: helicopterPilots.length,
          names: helicopterPilots.map((p) => p.displayName),
        },
        referralStats,
        userList,
      };
    }),
});
