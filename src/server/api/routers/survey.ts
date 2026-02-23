import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const surveyRouter = createTRPCRouter({
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
        answers: z.record(
          z.string(),
          z.union([z.number(), z.string(), z.array(z.string())])
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
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
          gender: "",
          age: 0,
          school: "",
        },
        update: {
          displayName: input.displayName,
        },
      });

      await ctx.db.surveyResponse.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          answers: JSON.stringify(input.answers),
          coreValues: "",
          completed: true,
          optedIn: true,
        },
        update: {
          answers: JSON.stringify(input.answers),
          completed: true,
          optedIn: true,
        },
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
