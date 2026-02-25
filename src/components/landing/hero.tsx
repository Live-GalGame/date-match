import Link from "next/link";

export function Hero({ code }: { code?: string }) {
  const surveyHref = code
    ? `/onboarding/survey?code=${encodeURIComponent(code)}`
    : "/onboarding/survey";

  return (
    <section className="relative min-h-[70vh] flex flex-col items-center justify-center text-center hero-gradient text-white overflow-hidden">
      <div className="absolute inset-0 bg-[url('/stars.svg')] opacity-30 bg-repeat" />

      <nav className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-5 z-10">
        <Link href="/" className="text-xl font-serif tracking-wide text-white/90 hover:text-white transition-colors">
          关系基因匹配
        </Link>
        <Link
          href="/auth/signin"
          className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm border border-white/20 hover:bg-white/20 transition-all"
        >
          已测试，去登录
        </Link>
      </nav>

      <div className="relative z-10 max-w-2xl mx-auto px-6 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-serif leading-tight mb-6">
          不止于相遇，
          <br />
          <span className="text-white/80">致力于相知。</span>
        </h1>
        <p className="text-lg md:text-xl text-white/70 mb-10 max-w-lg mx-auto">
          基于心理学的深度兼容性测试，每周为你匹配一位灵魂契合的人。
        </p>
        <Link
          href={surveyHref}
          className="inline-block px-10 py-4 rounded-full bg-white text-primary font-medium text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all mb-8"
        >
          开始测试
        </Link>

        {/* TODO: 设计一个更漂亮的 Social Proof 方案
        <div className="flex items-center justify-center gap-3 text-sm text-white/80 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center -space-x-3">
            <div className="w-9 h-9 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center backdrop-blur-sm">
              <span className="text-sm">👩🏻</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center backdrop-blur-sm z-10">
              <span className="text-sm">🧑🏽</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center backdrop-blur-sm z-20">
              <span className="text-sm">👨🏻‍🦱</span>
            </div>
          </div>
          <div className="flex flex-col items-start text-left">
            <div className="flex items-center text-yellow-400 text-xs tracking-widest mb-0.5">
              ★★★★★
            </div>
            <span>已有 <span className="font-semibold text-white">2,000+</span> 人寻找共鸣</span>
          </div>
        </div>
        */}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
