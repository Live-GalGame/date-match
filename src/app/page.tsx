import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Footer } from "@/components/landing/footer";
import { db } from "@/server/db";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const [{ code }, participantCount] = await Promise.all([
    searchParams,
    db.surveyResponse.count({ where: { completed: true } }).catch(() => 0),
  ]);

  return (
    <main>
      <Hero code={code} participantCount={participantCount} />
      <HowItWorks />
      <Footer />
    </main>
  );
}
