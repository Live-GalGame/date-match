"use client";

import { trpc } from "@/lib/trpc";
import Link from "next/link";

export default function DashboardPage() {
  const { data: latestMatch, isLoading: matchLoading } = trpc.match.getLatest.useQuery();
  const { data: survey, isLoading: surveyLoading } = trpc.survey.get.useQuery();
  const { data: profile } = trpc.profile.get.useQuery();

  const optInMutation = trpc.survey.optIn.useMutation();
  const optOutMutation = trpc.survey.optOut.useMutation();

  const isOptedIn = survey?.optedIn ?? false;
  const surveyCompleted = survey?.completed ?? false;

  function toggleOptIn() {
    if (isOptedIn) {
      optOutMutation.mutate(undefined, {
        onSuccess: () => window.location.reload(),
      });
    } else {
      optInMutation.mutate(undefined, {
        onSuccess: () => window.location.reload(),
      });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link href="/" className="text-xl font-serif text-primary">
          关系基因匹配
        </Link>
        <div className="flex items-center gap-4">
          {profile && (
            <span className="text-sm text-muted-foreground">
              {profile.displayName}，你好
            </span>
          )}
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-serif mb-2">我的面板</h1>
          <p className="text-muted-foreground">
            管理你的匹配偏好，查看匹配结果。
          </p>
        </div>

        {/* Opt-in Card */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-serif mb-1">每周匹配</h2>
              <p className="text-sm text-muted-foreground">
                {surveyCompleted
                  ? isOptedIn
                    ? "你已加入本周的匹配轮次。"
                    : "加入本周匹配，等待你的结果。"
                  : "请先完成问卷，才能参与匹配。"}
              </p>
            </div>
            {surveyCompleted ? (
              <button
                onClick={toggleOptIn}
                disabled={optInMutation.isPending || optOutMutation.isPending}
                className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all ${
                  isOptedIn
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-primary text-primary-foreground hover:bg-accent"
                }`}
              >
                {isOptedIn ? "已加入 ✓" : "加入匹配"}
              </button>
            ) : (
              <Link
                href="/onboarding/survey"
                className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:bg-accent transition-all"
              >
                填写问卷
              </Link>
            )}
          </div>
        </div>

        {/* Latest Match Card */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <h2 className="text-lg font-serif mb-4">最新匹配</h2>
          {matchLoading || surveyLoading ? (
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
              加载中...
            </div>
          ) : latestMatch ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-xl">
                    {latestMatch.partner.name || "你的匹配对象"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    📧 {latestMatch.partner.email}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-serif text-primary">
                    {latestMatch.compatibility}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    契合度
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">匹配原因：</p>
                <ul className="space-y-2">
                  {latestMatch.reasons.map((reason, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-sm text-muted-foreground"
                    >
                      <span className="text-primary mt-0.5">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-muted-foreground">
                第 {latestMatch.week} 周
              </p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-3">💌</div>
              <p className="text-sm">
                暂无匹配。加入匹配后等待每周匹配轮次吧！
              </p>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/onboarding/profile"
            className="bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="font-medium mb-1">编辑资料</h3>
            <p className="text-xs text-muted-foreground">
              更新你的个人信息
            </p>
          </Link>
          <Link
            href="/onboarding/survey"
            className="bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="font-medium mb-1">重新填写问卷</h3>
            <p className="text-xs text-muted-foreground">
              更新你的偏好设置
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
