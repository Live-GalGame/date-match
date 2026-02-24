"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useMemo } from "react";

const CONFETTI_COLORS = [
  "#8b2252", "#c4536a", "#e8c49a", "#f5ebe3",
  "#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff",
  "#ff8fab", "#a855f7", "#f97316", "#06b6d4",
];

function ConfettiPiece({ index }: { index: number }) {
  const style = useMemo(() => {
    const left = Math.random() * 100;
    const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
    const delay = Math.random() * 2;
    const duration = 2.5 + Math.random() * 2;
    const rotation = Math.random() * 360;
    const size = 6 + Math.random() * 8;
    const isCircle = Math.random() > 0.5;

    return {
      left: `${left}%`,
      backgroundColor: color,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
      width: isCircle ? `${size}px` : `${size * 0.6}px`,
      height: `${size}px`,
      borderRadius: isCircle ? "50%" : "2px",
      transform: `rotate(${rotation}deg)`,
    };
  }, [index]);

  return (
    <div
      className="absolute top-0 animate-confetti-fall"
      style={style}
    />
  );
}

function VerifiedContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  if (status === "expired") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center animate-fade-in">
          <div className="text-6xl mb-6">😢</div>
          <h1 className="text-3xl font-serif mb-4 text-foreground">
            链接已过期
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            验证链接已失效，请重新提交问卷以获取新的验证邮件。
          </p>
          <Link
            href="/onboarding/survey"
            className="inline-block py-3 px-8 rounded-full bg-primary text-primary-foreground font-medium text-lg hover:bg-accent transition-colors"
          >
            重新填写问卷
          </Link>
        </div>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center animate-fade-in">
          <div className="text-6xl mb-6">❌</div>
          <h1 className="text-3xl font-serif mb-4 text-foreground">
            无效的链接
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            该验证链接无效，请检查邮件中的链接是否完整。
          </p>
          <Link
            href="/"
            className="inline-block py-3 px-8 rounded-full bg-primary text-primary-foreground font-medium text-lg hover:bg-accent transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 overflow-hidden relative">
      {/* Confetti */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
        {Array.from({ length: 60 }, (_, i) => (
          <ConfettiPiece key={i} index={i} />
        ))}
      </div>

      <div className="relative z-20 max-w-md w-full text-center animate-fade-in">
        <div className="text-7xl mb-4 animate-verified-bounce">🎉</div>
        <div className="text-5xl mb-6 animate-verified-pop">✅</div>

        <h1 className="text-3xl sm:text-4xl font-serif mb-4 text-primary">
          邮箱验证成功！
        </h1>
        <p className="text-lg text-foreground font-medium mb-2">
          你已成功加入匹配池
        </p>
        <p className="text-muted-foreground mb-8">
          我们会在每周匹配轮次中为你寻找最契合的对象，匹配成功后将通过邮件通知你。
        </p>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm text-left mb-8">
          <h3 className="font-serif text-lg mb-4">接下来会发生什么？</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3 items-start">
              <span className="text-primary text-base font-bold shrink-0">1.</span>
              <span>系统每周运行匹配算法，为你寻找最高兼容度的对象</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-primary text-base font-bold shrink-0">2.</span>
              <span>匹配成功后，你会收到一封包含对方信息和匹配原因的邮件</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-primary text-base font-bold shrink-0">3.</span>
              <span>收到匹配结果后，主动迈出第一步吧</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/auth/signin"
            className="inline-block py-3 px-8 rounded-full bg-primary text-primary-foreground font-medium text-lg hover:bg-accent transition-colors"
          >
            登录查看面板
          </Link>
          <Link
            href="/"
            className="inline-block py-3 px-8 rounded-full border border-border text-foreground font-medium text-lg hover:bg-muted transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function EmailVerifiedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      }
    >
      <VerifiedContent />
    </Suspense>
  );
}
