import { z } from "zod";
import { randomUUID } from "crypto";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { sendConfirmationEmail } from "@/server/email/send-confirmation";

const FAKE_HELICOPTER_NAMES = [
  "AH-64恋爱中", "黑鹰小甜心", "直-20暖男", "旋翼少女心",
  "会飞的暖宝宝", "螺旋桨小公主", "低空飞行的浪漫", "自由翱翔er",
  "悬停等你ing", "涡轴心跳加速", "雌鹿想脱单", "支奴干的温柔",
  "眼镜蛇的微笑", "Ka-52求偶中", "旋风小队长", "夜鹰出击",
  "阿帕奇暴击", "Mi-28猎人", "超级种马", "海王直升机",
];

export const surveyRouter = createTRPCRouter({
  getHelicopterPilots: publicProcedure.query(async ({ ctx }) => {
    const pilots = await ctx.db.profile.findMany({
      where: { gender: "武装直升机" },
      select: { displayName: true },
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const answersWithMeta = {
        ...input.answers,
        _surveyVersion: input.surveyVersion ?? "v2",
      };

      const user = await ctx.db.user.upsert({
        where: { email: input.email },
        create: {
          email: input.email,
          name: input.displayName,
        },
        update: {
          name: input.displayName,
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
        process.env.BETTER_AUTH_URL || "http://localhost:3000";
      const verifyUrl = `${baseUrl}/api/verify-email?token=${token}`;

      sendConfirmationEmail({
        toEmail: input.email,
        displayName: input.displayName,
        verifyUrl,
      }).catch((err) => {
        console.error("[sendConfirmationEmail] failed:", err);
      });

      return { success: true, userId: user.id };
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
