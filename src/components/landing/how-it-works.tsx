const steps = [
  {
    number: "01",
    title: "Tell us about yourself",
    description:
      "Your core values, interests, and what matters to you in a relationship. Our questionnaire is research-backed and takes about 10 minutes.",
    gradient: "from-[#5a2d3e] to-[#8b4a6b]",
    preview: (
      <div className="bg-white/90 backdrop-blur rounded-2xl p-5 shadow-lg max-w-[260px]">
        <p className="text-sm font-medium text-foreground mb-3">
          Having children is essential for a fulfilling life
        </p>
        <div className="flex gap-1.5 mb-2">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                n === 5
                  ? "bg-primary text-white scale-110"
                  : "bg-muted text-muted-foreground hover:bg-border"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Hard pass</span>
          <span>It&apos;s my dream</span>
        </div>
        <div className="mt-4">
          <p className="text-xs font-medium text-foreground mb-2">My top 4 core values:</p>
          <div className="flex flex-wrap gap-1.5">
            {["Adventure", "Curiosity", "Kindness", "Honesty", "Freedom", "Loyalty"].map(
              (v, i) => (
                <span
                  key={v}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                    i < 2
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {v}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    ),
  },
  {
    number: "02",
    title: "Get matched weekly",
    description:
      "Opt in before the weekly deadline, and we'll send you a match with a note on why we think you'll click.",
    gradient: "from-[#2d3a5a] to-[#4a6b8b]",
    preview: (
      <div className="bg-white/90 backdrop-blur rounded-2xl p-5 shadow-lg max-w-[260px]">
        <h4 className="font-serif text-base mb-3 text-foreground">Your match: Alex</h4>
        <div className="space-y-1.5 text-sm text-muted-foreground mb-3">
          <p>📧 alex@university.edu</p>
          <p>🎯 94.7% compatibility</p>
        </div>
        <p className="text-xs font-medium text-foreground mb-2">Here&apos;s why:</p>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li className="flex gap-1.5">
            <span className="text-primary mt-0.5">•</span>
            You both value independence but prioritize keeping in touch
          </li>
          <li className="flex gap-1.5">
            <span className="text-primary mt-0.5">•</span>
            &quot;Curiosity&quot; and &quot;Adventure&quot; in both your top values
          </li>
          <li className="flex gap-1.5">
            <span className="text-primary mt-0.5">•</span>
            Similar views on work-life balance
          </li>
        </ul>
      </div>
    ),
  },
  {
    number: "03",
    title: "Go on a date!",
    description:
      "We give you their email. You figure out the rest — meet up, grab coffee, and maybe find something real.",
    gradient: "from-[#3d2d5a] to-[#6b4a8b]",
    preview: null,
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 px-6 bg-background">
      <h2 className="text-4xl font-serif text-center mb-16">How it works</h2>
      <div className="max-w-5xl mx-auto space-y-8">
        {steps.map((step) => (
          <div
            key={step.number}
            className={`relative rounded-3xl bg-gradient-to-br ${step.gradient} p-8 md:p-12 overflow-hidden min-h-[280px]`}
          >
            <div className="absolute inset-0 bg-[url('/stars.svg')] opacity-20 bg-repeat" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
              <div className="flex-1">
                <h3 className="text-2xl md:text-3xl font-serif text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-white/70 text-base md:text-lg max-w-md">
                  {step.description}
                </p>
              </div>
              {step.preview && (
                <div className="flex-shrink-0">{step.preview}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
