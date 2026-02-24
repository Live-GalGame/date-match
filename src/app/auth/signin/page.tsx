"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await authClient.signIn.magicLink({ email, callbackURL: "/dashboard" });
      setSent(true);
    } catch {
      setError("Failed to send magic link. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center animate-fade-in">
          <div className="text-5xl mb-6">✉️</div>
          <h1 className="text-3xl font-serif text-primary mb-4">查看你的邮箱</h1>
          <p className="text-muted-foreground text-lg mb-2">
            我们已发送登录链接到
          </p>
          <p className="text-foreground font-medium text-lg mb-8">{email}</p>
          <p className="text-muted-foreground text-sm">
            点击邮件中的链接即可登录，链接 5 分钟内有效。
          </p>
          <p className="text-muted-foreground text-xs mt-4">
            没收到？请检查垃圾邮件文件夹，部分邮箱可能需要 1-2 分钟送达。
          </p>
          <button
            onClick={() => setSent(false)}
            className="mt-6 text-primary underline underline-offset-4 text-sm hover:text-accent transition-colors"
          >
            换一个邮箱
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full animate-fade-in">
        <div className="text-center mb-10">
          <Link href="/" className="text-3xl font-serif text-primary hover:text-accent transition-colors">
            date match.
          </Link>
          <h1 className="text-2xl font-serif mt-6 mb-2">登录</h1>
          <p className="text-muted-foreground">
            输入你提交问卷时使用的邮箱
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-xl px-4 py-3.5 mb-6">
          <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
            <span className="font-semibold">第一次来？</span>{" "}
            登录仅限已完成测试的用户。请先{" "}
            <Link
              href="/onboarding/survey"
              className="font-bold underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-200 transition-colors"
            >
              完成测试
            </Link>
            ，提交后即可进入匹配。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              邮箱地址
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium text-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "发送中..." : "发送登录链接"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          我们会发送一封含有登录链接的邮件，无需密码。
        </p>

        <div className="text-center mt-4">
          <Link
            href="/onboarding/survey"
            className="text-primary text-sm font-medium hover:text-accent transition-colors"
          >
            还没做过测试？去填写问卷 →
          </Link>
        </div>
      </div>
    </div>
  );
}
