import { createTRPCRouter } from "./trpc";
import { profileRouter } from "./routers/profile";
import { qualificationRouter } from "./routers/qualification";
import { surveyRouter } from "./routers/survey";
import { matchRouter } from "./routers/match";
import { analyticsRouter } from "./routers/analytics";

export const appRouter = createTRPCRouter({
  profile: profileRouter,
  qualification: qualificationRouter,
  survey: surveyRouter,
  match: matchRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
