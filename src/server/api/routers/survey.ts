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
    const names = pilots.map((p) => p.displayName);
    return { count: names.length, names };
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
        turnstileToken: z.string().optional(),
        honeypot: z.string().max(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.honeypot) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid submission" });
      }

      const email = input.email.toLowerCase().trim();

      const domain = email.split("@")[1];
      if (!domain || BLOCKED_EMAIL_DOMAINS.has(domain)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "请使用有效的邮箱地址" });
      }

      const answerKeys = Object.keys(input.answers).filter(k => !k.startsWith("_"));
      if (answerKeys.length < 3) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "问卷数据不完整，请返回检查" });
      }

      // Turnstile: validate if token present, skip if absent (graceful degradation for China network)
      if (input.turnstileToken) {
        const turnstileOk = await verifyTurnstileToken(input.turnstileToken);
        if (!turnstileOk) {
          throw new TRPCError({ code: "FORBIDDEN", message: "人机验证失败，请刷新页面重试" });
        }
      }

      // Same-email cooldown: 1 min
      const oneMinAgo = new Date(Date.now() - 60 * 1000);
      const recentEmailSubmit = await ctx.db.verification.count({
        where: { identifier: email, createdAt: { gte: oneMinAgo } },
      });
      if (recentEmailSubmit > 0) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "提交过于频繁，请 1 分钟后再试" });
      }

      // IP rate limit: max 10 submissions per 10 min (without Turnstile token, stricter: 5)
      const ip = ctx.ip;
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
      const recentIpCount = await ctx.db.verification.count({
        where: { identifier: `rate:ip:${ip}`, createdAt: { gte: tenMinAgo } },
      });
      const ipLimit = input.turnstileToken ? 10 : 5;
      if (recentIpCount >= ipLimit) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "当前网络提交过于频繁，请稍后再试" });
      }
      await ctx.db.verification.create({
        data: {
          identifier: `rate:ip:${ip}`,
          value: "submit",
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      const answersWithMeta = {
        ...input.answers,
        _surveyVersion: input.surveyVersion ?? "v2",
      };

      const user = await ctx.db.user.upsert({
        where: { email },
        create: {
          email,
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
          identifier: email,
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
          toEmail: email,
          displayName: input.displayName,
          verifyUrl,
        });
      } catch (err) {
        emailSent = false;
        console.error("[sendConfirmationEmail] failed:", err);
      }

      return { success: true, userId: user.id, emailSent, shareCode: user.id };
    }),

  resendConfirmation: publicProcedure
    .input(z.object({
      email: z.string().email(),
      turnstileToken: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase().trim();

      const domain = email.split("@")[1];
      if (!domain || BLOCKED_EMAIL_DOMAINS.has(domain)) {
        return { success: true };
      }

      if (input.turnstileToken) {
        const turnstileOk = await verifyTurnstileToken(input.turnstileToken);
        if (!turnstileOk) {
          throw new TRPCError({ code: "FORBIDDEN", message: "人机验证失败，请刷新页面重试" });
        }
      }

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentCount = await ctx.db.verification.count({
        where: {
          identifier: email,
          createdAt: { gte: oneHourAgo },
        },
      });
      if (recentCount >= 5) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "发送过于频繁，请稍后再试" });
      }

      const user = await ctx.db.user.findUnique({
        where: { email },
        select: { id: true, name: true },
      });

      if (!user) {
        return { success: true };
      }

      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await ctx.db.verification.create({
        data: {
          identifier: email,
          value: token,
          expiresAt,
        },
      });

      const baseUrl =
        (process.env.BETTER_AUTH_URL || "http://localhost:3000").trim();
      const verifyUrl = `${baseUrl}/api/verify-email?token=${token}`;

      await sendConfirmationEmail({
        toEmail: email,
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
