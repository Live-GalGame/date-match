import Link from "next/link";

export function Hero() {
  return (
    <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center hero-gradient text-white overflow-hidden">
      <div className="absolute inset-0 bg-[url('/stars.svg')] opacity-30 bg-repeat" />

      <nav className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-5 z-10">
        <Link href="/" className="text-xl font-serif tracking-wide text-white/90 hover:text-white transition-colors">
          date match.
        </Link>
        <Link
          href="/auth/signin"
          className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm border border-white/20 hover:bg-white/20 transition-all"
        >
          Sign in
        </Link>
      </nav>

      <div className="relative z-10 max-w-2xl mx-auto px-6 animate-fade-in">
        <h1 className="text-5xl md:text-6xl font-serif leading-tight mb-6">
          Match without swiping.
          <br />
          <span className="text-white/80">Find your person.</span>
        </h1>
        <p className="text-lg md:text-xl text-white/70 mb-10 max-w-lg mx-auto">
          Take our research-based compatibility quiz, get a thoughtful match each week.
        </p>
        <Link
          href="/auth/signin"
          className="inline-block px-10 py-4 rounded-full bg-white text-primary font-medium text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          Get Started
        </Link>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
