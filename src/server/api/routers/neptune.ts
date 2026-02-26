import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const neptuneRouter = createTRPCRouter({
  submit: publicProcedure
    .input(
      z.object({
        displayName: z.string().min(1).max(50),
        mbti: z.string().max(10),
        zodiac: z.string().max(10),
        answers: z.record(
          z.string(),
          z.union([z.number(), z.string(), z.array(z.string())]),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const response = await ctx.db.neptuneResponse.create({
        data: {
          displayName: input.displayName.trim(),
          mbti: input.mbti,
          zodiac: input.zodiac,
          answers: JSON.stringify(input.answers),
        },
      });

      return { success: true, id: response.id };
    }),
});
