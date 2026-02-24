"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { trpc } from "@/lib/trpc";

const TOKEN_KEY = "metrics_token";

function UserDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") ?? "";

  const [token, setToken] = useState("");
  useEffect(() => {
    setToken(sessionStorage.getItem(TOKEN_KEY) ?? "");
  }, []);

  const { data, isLoading, error } = trpc.analytics.getUserDetail.useQuery(
    { token, email },
    { enabled: !!token && !!email, retry: false },
  );

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">请先在数据看板中登录</p>
          <button
            onClick={() => router.push("/metrics")}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-accent transition-colors"
          >
            前往数据看板
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
          加载中...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-destructive font-medium">{error.message}</p>
          <button
            onClick={() => router.push("/metrics")}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-accent transition-colors"
          >
            返回数据看板
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.push("/metrics")}
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            ← 返回看板
          </button>
          <h1 className="text-xl font-serif text-primary">
            {data.name || data.email.split("@")[0]} 的问卷详情
          </h1>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* User info card */}
        <section className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-serif">基本信息</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <InfoItem label="昵称" value={data.name || "-"} />
            <InfoItem label="邮箱" value={data.email} />
            <InfoItem label="问卷版本" value={data.surveyVersion || "-"} />
            {data.profile && (
              <>
                <InfoItem label="性别" value={data.profile.gender || "-"} />
                <InfoItem label="年龄" value={data.profile.age ? String(data.profile.age) : "-"} />
                <InfoItem label="择偶偏好" value={data.profile.datingPreference || "-"} />
                <InfoItem label="学校" value={data.profile.school || "-"} />
                <InfoItem label="学历" value={data.profile.education || "-"} />
                <InfoItem label="院校层次" value={data.profile.schoolTier || "-"} />
              </>
            )}
            <InfoItem
              label="注册时间"
              value={new Date(data.createdAt).toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            />
            <InfoItem label="来源" value={data.referralCode || "自然流量"} />
          </div>
          <div className="flex gap-2 pt-1">
            {data.completed && (
              <span className="px-2.5 py-1 rounded-full text-xs bg-green-100 text-green-700 font-medium">已完成</span>
            )}
            {data.optedIn && (
              <span className="px-2.5 py-1 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">已匹配</span>
            )}
            {data.emailVerified && (
              <span className="px-2.5 py-1 rounded-full text-xs bg-purple-100 text-purple-700 font-medium">已验证</span>
            )}
            {!data.completed && (
              <span className="px-2.5 py-1 rounded-full text-xs bg-muted text-muted-foreground font-medium">未完成</span>
            )}
          </div>
        </section>

        {/* Survey answers by section */}
        {data.sections.length === 0 ? (
          <section className="bg-card rounded-2xl border border-border shadow-sm p-6 text-center text-muted-foreground">
            该用户尚未提交问卷
          </section>
        ) : (
          data.sections.map((section, idx) => (
            <section
              key={`${section.versionId}-${section.title}`}
              className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-serif">{section.title}</h2>
                  {data.surveyVersion.includes("+") && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                      {section.versionId === "v3-lite" ? "快速版" : "深度版"}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {section.description}
                </p>
              </div>
              <div className="divide-y divide-border/50">
                {section.questions.map((q) => (
                  <div key={q.id} className="px-6 py-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <TypeBadge type={q.type} />
                      <p className="text-sm font-medium leading-relaxed flex-1">
                        {q.question}
                      </p>
                    </div>
                    {q.note && (
                      <p className="text-xs text-muted-foreground ml-14 italic">
                        {q.note}
                      </p>
                    )}
                    <div className="ml-14">
                      {q.formattedAnswer === "(未作答)" ? (
                        <span className="text-sm text-muted-foreground italic">
                          未作答
                        </span>
                      ) : q.type === "ranking" ? (
                        <div className="space-y-1">
                          {q.formattedAnswer.split("\n").map((line, i) => (
                            <p key={i} className="text-sm leading-relaxed">
                              {line}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed bg-primary/5 text-foreground rounded-lg px-3 py-2">
                          {q.formattedAnswer}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs mb-0.5">{label}</p>
      <p className="font-medium break-all">{value}</p>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; color: string }> = {
    slider: { label: "滑块", color: "bg-cyan-100 text-cyan-700" },
    single: { label: "单选", color: "bg-indigo-100 text-indigo-700" },
    tags: { label: "多选", color: "bg-amber-100 text-amber-700" },
    ranking: { label: "排序", color: "bg-emerald-100 text-emerald-700" },
    open_text: { label: "文本", color: "bg-rose-100 text-rose-700" },
  };
  const info = map[type] ?? { label: type, color: "bg-muted text-muted-foreground" };
  return (
    <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${info.color}`}>
      {info.label}
    </span>
  );
}

export default function UserDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
            加载中...
          </div>
        </div>
      }
    >
      <UserDetailContent />
    </Suspense>
  );
}
