import { createTRPCRouter, protectedProcedure } from "../trpc";

export const matchRouter = createTRPCRouter({
  getMyMatches: protectedProcedure.query(async ({ ctx }) => {
    const matches = await ctx.db.match.findMany({
      where: {
        OR: [{ user1Id: ctx.user.id }, { user2Id: ctx.user.id }],
      },
      include: {
        user1: { select: { id: true, email: true, name: true } },
        user2: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return matches.map((m) => {
      const isUser1 = m.user1Id === ctx.user.id;
      const partner = isUser1 ? m.user2 : m.user1;
      return {
        id: m.id,
        partner,
        compatibility: m.compatibility,
        reasons: JSON.parse(m.reasons) as string[],
        week: m.week,
        createdAt: m.createdAt,
      };
    });
  }),

  getLatest: protectedProcedure.query(async ({ ctx }) => {
    const match = await ctx.db.match.findFirst({
      where: {
        OR: [{ user1Id: ctx.user.id }, { user2Id: ctx.user.id }],
      },
      include: {
        user1: { select: { id: true, email: true, name: true } },
        user2: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!match) return null;

    const isUser1 = match.user1Id === ctx.user.id;
    const partner = isUser1 ? match.user2 : match.user1;
    return {
      id: match.id,
      partner,
      compatibility: match.compatibility,
      reasons: JSON.parse(match.reasons) as string[],
      week: match.week,
      createdAt: match.createdAt,
    };
  }),
});
