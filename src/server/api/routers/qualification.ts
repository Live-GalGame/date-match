import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const qualificationRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.qualification.findUnique({
      where: { userId: ctx.user.id },
    });
  }),

  upsert: protectedProcedure
    .input(
      z.object({
        eduEmail: z.string().email().optional(),
        diplomaUrl: z.string().url().optional(),
        otherProof: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.qualification.upsert({
        where: { userId: ctx.user.id },
        create: { userId: ctx.user.id, ...input },
        update: input,
      });
    }),

  verifyEduEmail: protectedProcedure
    .input(z.object({ eduEmail: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const isEdu = input.eduEmail.endsWith(".edu") || input.eduEmail.endsWith(".edu.cn");
      return ctx.db.qualification.upsert({
        where: { userId: ctx.user.id },
        create: {
          userId: ctx.user.id,
          eduEmail: input.eduEmail,
          eduVerified: isEdu,
          status: isEdu ? "verified" : "pending",
        },
        update: {
          eduEmail: input.eduEmail,
          eduVerified: isEdu,
          status: isEdu ? "verified" : "pending",
        },
      });
    }),
});
