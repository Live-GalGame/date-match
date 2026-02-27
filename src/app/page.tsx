import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Footer } from "@/components/landing/footer";
import { db } from "@/server/db";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const [{ code }] = await Promise.all([searchParams]);
  let participantCount = 0;
  try {
    participantCount = await db.surveyResponse.count({
      where: { completed: true },
    });
  } catch {
    // 本地无 DB 或网络不可达时降级，首页照常渲染
  }

  return (
    <main>
      <Hero code={code} participantCount={participantCount} />
      <HowItWorks />
      <Footer />
    </main>
  );
}
