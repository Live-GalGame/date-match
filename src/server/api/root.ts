import { createTRPCRouter } from "./trpc";
import { profileRouter } from "./routers/profile";
import { qualificationRouter } from "./routers/qualification";
import { surveyRouter } from "./routers/survey";
import { matchRouter } from "./routers/match";
import { analyticsRouter } from "./routers/analytics";
import { neptuneRouter } from "./routers/neptune";

export const appRouter = createTRPCRouter({
  profile: profileRouter,
  qualification: qualificationRouter,
  survey: surveyRouter,
  match: matchRouter,
  analytics: analyticsRouter,
  neptune: neptuneRouter,
});

export type AppRouter = typeof appRouter;
