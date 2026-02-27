import { z } from "zod/v4";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const feedbackRouter = createTRPCRouter({
  submitFeedback: protectedProcedure
    .input(
      z.object({
        matchId: z.string(),
        status: z.enum([
          "chatting_well",
          "occasionally",
          "added_no_chat",
          "incompatible",
          "no_response",
        ]),
        issues: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.matchFeedback.upsert({
        where: {
          matchId_userId: {
            matchId: input.matchId,
            userId: ctx.user.id,
          },
        },
        update: {
          status: input.status,
          issues: JSON.stringify(input.issues ?? []),
        },
        create: {
          matchId: input.matchId,
          userId: ctx.user.id,
          status: input.status,
          issues: JSON.stringify(input.issues ?? []),
        },
      });
    }),

  getMyFeedback: protectedProcedure
    .input(z.object({ matchId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.matchFeedback.findUnique({
        where: {
          matchId_userId: {
            matchId: input.matchId,
            userId: ctx.user.id,
          },
        },
      });
    }),
});
