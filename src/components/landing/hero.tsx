import Link from "next/link";
import { CountdownTimer } from "./countdown-timer";

export function Hero({ code, participantCount }: { code?: string; participantCount?: number }) {
  const surveyHref = code
    ? `/onboarding/survey?code=${encodeURIComponent(code)}`
    : "/onboarding/survey";

  return (
    <section className="relative min-h-[70vh] flex flex-col items-center justify-center text-center hero-gradient text-white overflow-hidden">
      <div className="absolute inset-0 bg-[url('/stars.svg')] opacity-30 bg-repeat" />

      <nav className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-5 z-10">
        <Link href="/" className="text-xl font-serif tracking-wide hover:text-white transition-colors" style={{ color: "rgba(255,255,255,0.9)" }}>
          关系基因匹配
        </Link>
        <Link
          href="/auth/signin"
          className="px-5 py-2 rounded-full text-white text-sm transition-all"
          style={{ backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
        >
          已测试，去登录
        </Link>
      </nav>

      <div className="relative z-10 max-w-2xl mx-auto px-6 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-serif leading-tight mb-6">
          不止于相遇，
          <br />
          <span style={{ color: "rgba(255,255,255,0.8)" }}>致力于相知。</span>
        </h1>
        <p className="text-lg md:text-xl mb-8 max-w-lg mx-auto" style={{ color: "rgba(255,255,255,0.7)" }}>
          基于心理学的深度兼容性测试，每周为你匹配一位灵魂契合的人。
        </p>
        <Link
          href={surveyHref}
          className="inline-block px-10 py-4 rounded-full bg-white text-primary font-medium text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all mb-10"
        >
          开始测试
        </Link>

        <CountdownTimer participantCount={participantCount ?? 0} />
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
