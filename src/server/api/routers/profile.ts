import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const profileRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.profile.findUnique({
      where: { userId: ctx.user.id },
    });
  }),

  upsert: protectedProcedure
    .input(
      z.object({
        displayName: z.string().min(1).max(100),
        gender: z.string().min(1),
        age: z.number().int().min(18).max(100),
        school: z.string().min(1),
        major: z.string().optional(),
        classYear: z.string().optional(),
        bio: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.profile.upsert({
        where: { userId: ctx.user.id },
        create: { userId: ctx.user.id, ...input },
        update: input,
      });
    }),
});
