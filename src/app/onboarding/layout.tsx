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
      </nav>
      <div className="max-w-2xl mx-auto px-6 py-12">{children}</div>
    </div>
  );
}
