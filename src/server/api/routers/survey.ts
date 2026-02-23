import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

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
