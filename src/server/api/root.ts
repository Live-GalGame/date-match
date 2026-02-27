import { createTRPCRouter } from "./trpc";
import { profileRouter } from "./routers/profile";
import { qualificationRouter } from "./routers/qualification";
import { surveyRouter } from "./routers/survey";
import { matchRouter } from "./routers/match";
import { analyticsRouter } from "./routers/analytics";
import { neptuneRouter } from "./routers/neptune";
import { feedbackRouter } from "./routers/feedback";

export const appRouter = createTRPCRouter({
  profile: profileRouter,
  qualification: qualificationRouter,
  survey: surveyRouter,
  match: matchRouter,
  analytics: analyticsRouter,
  neptune: neptuneRouter,
  feedback: feedbackRouter,
});

export type AppRouter = typeof appRouter;
