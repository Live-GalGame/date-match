"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useSession, signOut } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";

function RadarAnimation() {
  return (
    <div className="relative w-48 h-48 mx-auto">
      {/* Concentric rings */}
      <div className="absolute inset-0 rounded-full border border-primary/10" />
      <div className="absolute inset-[16%] rounded-full border border-primary/15" />
      <div className="absolute inset-[32%] rounded-full border border-primary/20" />
      <div className="absolute inset-[48%] rounded-full border border-primary/30" />

      {/* Pulsing rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-primary/15 animate-radar-pulse" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 animate-radar-pulse-delay" />
      </div>

      {/* Sweep line */}
      <div className="absolute inset-0 animate-radar-sweep" style={{ transformOrigin: "center center" }}>
        <div
          className="absolute top-1/2 left-1/2 w-1/2 h-[2px] origin-left"
          style={{
            background: "linear-gradient(to right, var(--primary), transparent)",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-1/2 origin-left -translate-y-4"
          style={{
            height: "32px",
            background: "conic-gradient(from -90deg, transparent, var(--primary) 20%, transparent 40%)",
            opacity: 0.15,
            borderRadius: "0 50% 50% 0",
          }}
        />
      </div>

      {/* Center dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
      </div>

      {/* Scattered dots */}
      <div className="absolute top-[20%] left-[65%] w-1.5 h-1.5 rounded-full bg-accent/60 animate-radar-dot" />
      <div
        className="absolute top-[55%] left-[22%] w-1.5 h-1.5 rounded-full bg-accent/40 animate-radar-dot"
        style={{ animationDelay: "0.7s" }}
      />
      <div
        className="absolute top-[35%] left-[78%] w-1 h-1 rounded-full bg-primary/50 animate-radar-dot"
        style={{ animationDelay: "1.3s" }}
      />
    </div>
  );
}

function MatchStatusCard({
  surveyCompleted,
  isOptedIn,
  latestMatch,
  isLoading,
}: {
  surveyCompleted: boolean;
  isOptedIn: boolean;
  latestMatch: {
    id: string;
    partner: { id: string; email: string; name: string | null };
    compatibility: number;
    reasons: string[];
    week: string;
    createdAt: Date;
  } | null | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-8 border border-border shadow-sm">
        <div className="flex items-center justify-center gap-3 text-muted-foreground py-12">
          <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
          加载中...
        </div>
      </div>
    );
  }

  if (!surveyCompleted) {
    return (
      <div className="bg-card rounded-2xl p-8 border border-border shadow-sm text-center">
        <div className="text-5xl mb-4">📝</div>
        <h2 className="text-xl font-serif mb-2">还没有完成问卷</h2>
        <p className="text-muted-foreground mb-6">
          完成关系基因测试后，系统会为你寻找最契合的对象。
        </p>
        <Link
          href="/onboarding/survey"
          className="inline-block py-3 px-8 rounded-full bg-primary text-primary-foreground font-medium hover:bg-accent transition-colors"
        >
          开始测试
        </Link>
      </div>
    );
  }

  if (latestMatch) {
    return (
      <div className="bg-card rounded-2xl p-8 border border-border shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <h2 className="text-lg font-serif">最新匹配</h2>
          <span className="ml-auto text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
            第 {latestMatch.week} 周
          </span>
        </div>

        <div className="flex items-center gap-6 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl shrink-0">
            💕
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-xl truncate">
              {latestMatch.partner.name || "你的匹配对象"}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {latestMatch.partner.email}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-3xl font-serif text-primary">
              {latestMatch.compatibility}%
            </div>
            <div className="text-xs text-muted-foreground">契合度</div>
          </div>
        </div>

        <div className="bg-muted/50 rounded-xl p-4">
          <p className="text-sm font-medium mb-2">匹配原因</p>
          <ul className="space-y-1.5">
            {latestMatch.reasons.map((reason, i) => (
              <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                <span className="text-primary shrink-0">•</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (isOptedIn) {
    return (
      <div className="bg-card rounded-2xl p-8 border border-border shadow-sm text-center">
        <RadarAnimation />
        <h2 className="text-xl font-serif mt-6 mb-2">正在为你寻找最佳匹配</h2>
        <p className="text-muted-foreground text-sm">
          系统每周运行匹配算法，发现契合对象后将通过邮件通知你。
        </p>
        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-primary font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          匹配中
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-8 border border-border shadow-sm text-center">
      <div className="text-5xl mb-4">💤</div>
      <h2 className="text-xl font-serif mb-2">匹配已暂停</h2>
      <p className="text-muted-foreground text-sm">
        你已退出匹配池。开启匹配后，系统将在每周为你寻找最契合的对象。
      </p>
    </div>
  );
}

function ProfileCard({
  profile,
  isLoading,
}: {
  profile: {
    displayName: string;
    gender: string;
    age: number;
    school: string;
    education: string;
    schoolTier: string;
    datingPreference: string;
    major: string | null;
    classYear: string | null;
    bio: string | null;
  } | null | undefined;
  isLoading: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    gender: "",
    age: 20,
    school: "",
    major: "",
    classYear: "",
    bio: "",
    education: "",
    schoolTier: "",
    datingPreference: "",
  });

  const utils = trpc.useUtils();
  const mutation = trpc.profile.upsert.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate();
      setEditing(false);
    },
  });

  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional sync from async query data
      setForm({
        displayName: profile.displayName,
        gender: profile.gender,
        age: profile.age,
        school: profile.school,
        major: profile.major ?? "",
        classYear: profile.classYear ?? "",
        bio: profile.bio ?? "",
        education: profile.education ?? "",
        schoolTier: profile.schoolTier ?? "",
        datingPreference: profile.datingPreference ?? "",
      });
    }
  }, [profile]);

  function handleSave() {
    mutation.mutate({
      displayName: form.displayName,
      gender: form.gender,
      age: form.age,
      school: form.school,
      major: form.major || undefined,
      classYear: form.classYear || undefined,
      bio: form.bio || undefined,
      education: form.education || undefined,
      schoolTier: form.schoolTier || undefined,
      datingPreference: form.datingPreference || undefined,
    });
  }

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
        <div className="h-5 w-24 bg-muted rounded animate-pulse mb-4" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm text-center">
        <p className="text-muted-foreground text-sm">暂无个人资料，完成问卷后将自动创建。</p>
      </div>
    );
  }

  const genderLabel: Record<string, string> = {
    male: "男",
    female: "女",
    "non-binary": "非二元",
    other: "其他",
  };

  const preferenceLabel: Record<string, string> = {
    male: "男性",
    female: "女性",
    both: "不限",
  };

  if (editing) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-serif">编辑个人信息</h2>
          <button
            onClick={() => setEditing(false)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            取消
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">昵称</label>
              <input
                type="text"
                value={form.displayName}
                onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">年龄</label>
              <input
                type="number"
                min={18}
                max={100}
                value={form.age}
                onChange={(e) => setForm((p) => ({ ...p, age: parseInt(e.target.value) || 18 }))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">学校</label>
            <input
              type="text"
              value={form.school}
              onChange={(e) => setForm((p) => ({ ...p, school: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">专业（选填）</label>
              <input
                type="text"
                value={form.major}
                onChange={(e) => setForm((p) => ({ ...p, major: e.target.value }))}
                placeholder="如：计算机科学"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">年级（选填）</label>
              <select
                value={form.classYear}
                onChange={(e) => setForm((p) => ({ ...p, classYear: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              >
                <option value="">未选择</option>
                <option value="大一">大一</option>
                <option value="大二">大二</option>
                <option value="大三">大三</option>
                <option value="大四">大四</option>
                <option value="硕士">硕士</option>
                <option value="博士">博士</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">个人简介（选填）</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              placeholder="介绍一下自己吧..."
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {form.bio.length}/500
            </p>
          </div>

          {mutation.error && (
            <p className="text-destructive text-sm">保存失败，请重试。</p>
          )}

          <button
            onClick={handleSave}
            disabled={mutation.isPending || !form.displayName || !form.gender || !form.school}
            className="w-full py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? "保存中..." : "保存修改"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-serif">个人信息</h2>
        <button
          onClick={() => setEditing(true)}
          className="text-sm text-primary font-medium hover:text-accent transition-colors"
        >
          编辑
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-lg font-serif text-primary">
            {profile.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{profile.displayName}</p>
            <p className="text-xs text-muted-foreground">
              {genderLabel[profile.gender.toLowerCase()] ?? profile.gender}
              {profile.age ? ` · ${profile.age} 岁` : ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-border/50">
          <InfoItem label="学校" value={profile.school} />
          <InfoItem label="学历" value={profile.education} />
          <InfoItem label="专业" value={profile.major} />
          <InfoItem label="年级" value={profile.classYear} />
          <InfoItem
            label="择偶偏好"
            value={profile.datingPreference ? (preferenceLabel[profile.datingPreference.toLowerCase()] ?? profile.datingPreference) : null}
          />
          <InfoItem label="院校层级" value={profile.schoolTier} />
        </div>

        {profile.bio && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-1">个人简介</p>
            <p className="text-sm">{profile.bio}</p>
          </div>
        )}

        {(!profile.bio || !profile.major) && (
          <button
            onClick={() => setEditing(true)}
            className="w-full mt-2 py-2 rounded-xl border border-dashed border-primary/30 text-sm text-primary hover:bg-primary/5 transition-colors"
          >
            + 补充更多个人信息
          </button>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();

  const { data: latestMatch, isLoading: matchLoading } = trpc.match.getLatest.useQuery(
    undefined,
    { enabled: !!session }
  );
  const { data: survey, isLoading: surveyLoading } = trpc.survey.get.useQuery(
    undefined,
    { enabled: !!session }
  );
  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery(
    undefined,
    { enabled: !!session }
  );

  const optInMutation = trpc.survey.optIn.useMutation({
    onSuccess: () => window.location.reload(),
  });
  const optOutMutation = trpc.survey.optOut.useMutation({
    onSuccess: () => window.location.reload(),
  });

  const isOptedIn = survey?.optedIn ?? false;
  const surveyCompleted = survey?.completed ?? false;

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.push("/auth/signin");
    }
  }, [session, sessionLoading, router]);

  if (sessionLoading || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link href="/" className="text-xl font-serif text-primary">
          date match.
        </Link>
        <div className="flex items-center gap-4">
          {profile && (
            <span className="text-sm text-muted-foreground">
              {profile.displayName}，你好
            </span>
          )}
          <button
            onClick={() => signOut({ fetchOptions: { onSuccess: () => router.push("/") } })}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            退出登录
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-serif mb-1">我的面板</h1>
          <p className="text-muted-foreground text-sm">
            查看匹配状态，管理个人信息。
          </p>
        </div>

        {/* Match Status */}
        <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <MatchStatusCard
            surveyCompleted={surveyCompleted}
            isOptedIn={isOptedIn}
            latestMatch={latestMatch}
            isLoading={matchLoading || surveyLoading}
          />
        </div>

        {/* Opt-in toggle */}
        {surveyCompleted && (
          <div
            className="flex items-center justify-between bg-card rounded-2xl px-6 py-4 border border-border shadow-sm animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <div>
              <h3 className="text-sm font-medium">每周匹配</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isOptedIn ? "你已加入本周的匹配轮次" : "开启后参与每周自动匹配"}
              </p>
            </div>
            <button
              onClick={() => {
                if (isOptedIn) {
                  optOutMutation.mutate();
                } else {
                  optInMutation.mutate();
                }
              }}
              disabled={optInMutation.isPending || optOutMutation.isPending}
              className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                isOptedIn ? "bg-primary" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-200 ${
                  isOptedIn ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        )}

        {/* Profile Card */}
        <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <ProfileCard profile={profile} isLoading={profileLoading} />
        </div>

        {/* Footer links */}
        <div
          className="flex items-center justify-center gap-6 pt-4 pb-8 text-xs text-muted-foreground animate-fade-in"
          style={{ animationDelay: "0.4s" }}
        >
          <Link href="/onboarding/survey" className="hover:text-foreground transition-colors">
            重新填写问卷
          </Link>
          <span>·</span>
          <Link href="/" className="hover:text-foreground transition-colors">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
