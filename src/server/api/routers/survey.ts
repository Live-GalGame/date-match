import { z } from "zod";
import { randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { sendConfirmationEmail } from "@/server/email/send-confirmation";
import { verifyTurnstileToken } from "@/lib/turnstile";

const BLOCKED_EMAIL_DOMAINS = new Set([
  "example.com",
  "test.com",
  "mailinator.com",
  "tempmail.com",
  "throwaway.email",
  "guerrillamail.com",
  "yopmail.com",
  "sharklasers.com",
  "grr.la",
  "spam4.me",
]);

const FAKE_HELICOPTER_NAMES = [
  "AH-64恋爱中", "黑鹰小甜心", "直-20暖男", "旋翼少女心",
  "会飞的暖宝宝", "螺旋桨小公主", "低空飞行的浪漫", "自由翱翔er",
  "悬停等你ing", "涡轴心跳加速", "雌鹿想脱单", "支奴干的温柔",
  "眼镜蛇的微笑", "Ka-52求偶中", "旋风小队长", "夜鹰出击",
  "阿帕奇暴击", "Mi-28猎人", "超级种马", "海王直升机",
];

export const surveyRouter = createTRPCRouter({
  registerHelicopterPilot: publicProcedure
    .input(z.object({ displayName: z.string().min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
      const pilot = await ctx.db.helicopterPilot.create({
        data: { displayName: input.displayName.trim() },
      });
      return { id: pilot.id };
    }),

  getHelicopterPilots: publicProcedure.query(async ({ ctx }) => {
    const pilots = await ctx.db.helicopterPilot.findMany({
      select: { displayName: true },
      orderBy: { createdAt: "desc" },
    });
    const realNames = pilots.map((p) => p.displayName);
    if (realNames.length >= 10) {
      return { count: realNames.length, names: realNames };
    }
    const shuffled = [...FAKE_HELICOPTER_NAMES].sort(() => Math.random() - 0.5);
    const fakeCount = 10 + Math.floor(Math.random() * 6) - realNames.length;
    const padded = [...realNames, ...shuffled.slice(0, fakeCount)];
    return { count: padded.length, names: padded };
  }),

  get: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.surveyResponse.findUnique({
      where: { userId: ctx.user.id },
    });
  }),

  save: protectedProcedure
    .input(
      z.object({
        answers: z.record(
          z.string(),
          z.union([z.number(), z.string(), z.array(z.string())])
        ),
        coreValues: z.array(z.string()).optional(),
        completed: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const coreValuesStr = input.coreValues?.join(",") ?? "";
      return ctx.db.surveyResponse.upsert({
        where: { userId: ctx.user.id },
        create: {
          userId: ctx.user.id,
          answers: JSON.stringify(input.answers),
          coreValues: coreValuesStr,
          completed: input.completed ?? false,
        },
        update: {
          answers: JSON.stringify(input.answers),
          coreValues: coreValuesStr,
          completed: input.completed ?? false,
        },
      });
    }),

  submitPublic: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        displayName: z.string().min(1).max(50),
        gender: z.string().optional(),
        datingPreference: z.string().optional(),
        education: z.string().optional(),
        schoolTier: z.string().optional(),
        answers: z.record(
          z.string(),
          z.union([z.number(), z.string(), z.array(z.string())])
        ),
        surveyVersion: z.string().optional(),
        referralCode: z.string().max(100).optional(),
        turnstileToken: z.string().min(1),
        honeypot: z.string().max(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.honeypot) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid submission" });
      }

      const domain = input.email.split("@")[1]?.toLowerCase();
      if (!domain || BLOCKED_EMAIL_DOMAINS.has(domain)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "请使用有效的邮箱地址" });
      }

      const answerKeys = Object.keys(input.answers).filter(k => !k.startsWith("_"));
      if (answerKeys.length < 3) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "问卷数据不完整，请返回检查" });
      }

      const turnstileOk = await verifyTurnstileToken(input.turnstileToken);
      if (!turnstileOk) {
        throw new TRPCError({ code: "FORBIDDEN", message: "人机验证失败，请刷新页面重试" });
      }

      const answersWithMeta = {
        ...input.answers,
        _surveyVersion: input.surveyVersion ?? "v2",
      };

      const user = await ctx.db.user.upsert({
        where: { email: input.email },
        create: {
          email: input.email,
          name: input.displayName,
          referralCode: input.referralCode ?? "",
        },
        update: {
          name: input.displayName,
          ...(input.referralCode ? { referralCode: input.referralCode } : {}),
        },
      });

      await ctx.db.profile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          displayName: input.displayName,
          gender: input.gender ?? "",
          datingPreference: input.datingPreference ?? "",
          age: 0,
          school: "",
          education: input.education ?? "",
          schoolTier: input.schoolTier ?? "",
        },
        update: {
          displayName: input.displayName,
          gender: input.gender ?? undefined,
          datingPreference: input.datingPreference ?? undefined,
          education: input.education ?? undefined,
          schoolTier: input.schoolTier ?? undefined,
        },
      });

      await ctx.db.surveyResponse.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          answers: JSON.stringify(answersWithMeta),
          coreValues: "",
          completed: true,
          optedIn: true,
        },
        update: {
          answers: JSON.stringify(answersWithMeta),
          completed: true,
          optedIn: true,
        },
      });

      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await ctx.db.verification.create({
        data: {
          identifier: input.email,
          value: token,
          expiresAt,
        },
      });

      const baseUrl =
        (process.env.BETTER_AUTH_URL || "http://localhost:3000").trim();
      const verifyUrl = `${baseUrl}/api/verify-email?token=${token}`;

      let emailSent = true;
      try {
        await sendConfirmationEmail({
          toEmail: input.email,
          displayName: input.displayName,
          verifyUrl,
        });
      } catch (err) {
        emailSent = false;
        console.error("[sendConfirmationEmail] failed:", err);
      }

      return { success: true, userId: user.id, emailSent };
    }),

  resendConfirmation: publicProcedure
    .input(z.object({
      email: z.string().email(),
      turnstileToken: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const domain = input.email.split("@")[1]?.toLowerCase();
      if (!domain || BLOCKED_EMAIL_DOMAINS.has(domain)) {
        return { success: true };
      }

      const turnstileOk = await verifyTurnstileToken(input.turnstileToken);
      if (!turnstileOk) {
        throw new TRPCError({ code: "FORBIDDEN", message: "人机验证失败，请刷新页面重试" });
      }

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentCount = await ctx.db.verification.count({
        where: {
          identifier: input.email,
          createdAt: { gte: oneHourAgo },
        },
      });
      if (recentCount >= 5) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "发送过于频繁，请稍后再试" });
      }

      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
        select: { id: true, name: true },
      });

      if (!user) {
        return { success: true };
      }

      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await ctx.db.verification.create({
        data: {
          identifier: input.email,
          value: token,
          expiresAt,
        },
      });

      const baseUrl =
        (process.env.BETTER_AUTH_URL || "http://localhost:3000").trim();
      const verifyUrl = `${baseUrl}/api/verify-email?token=${token}`;

      await sendConfirmationEmail({
        toEmail: input.email,
        displayName: user.name || "User",
        verifyUrl,
      });

      return { success: true };
    }),

  optIn: protectedProcedure.mutation(async ({ ctx }) => {
    return ctx.db.surveyResponse.update({
      where: { userId: ctx.user.id },
      data: { optedIn: true },
    });
  }),

  optOut: protectedProcedure.mutation(async ({ ctx }) => {
    return ctx.db.surveyResponse.update({
      where: { userId: ctx.user.id },
      data: { optedIn: false },
    });
  }),
});
