import Link from "next/link";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link
          href="/"
          className="text-xl font-serif text-primary hover:text-accent transition-colors"
        >
          关系基因匹配
        </Link>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <StepDot step={1} label="资料" />
            <StepLine />
            <StepDot step={2} label="验证" />
            <StepLine />
            <StepDot step={3} label="问卷" />
          </div>
        </div>
      </nav>
      <div className="max-w-2xl mx-auto px-6 py-12">{children}</div>
    </div>
  );
}

function StepDot({ step, label }: { step: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium">
        {step}
      </div>
      <span className="hidden sm:inline text-xs">{label}</span>
    </div>
  );
}

function StepLine() {
  return <div className="w-8 h-px bg-border" />;
}
