"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";

const TOKEN_KEY = "metrics_token";

export default function MetricsPage() {
  const [token, setToken] = useState("");
  const [submittedToken, setSubmittedToken] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(TOKEN_KEY) ?? "";
    }
    return "";
  });

  const { data, isLoading, error } = trpc.analytics.getStats.useQuery(
    { token: submittedToken },
    { enabled: submittedToken.length > 0, retry: false },
  );

  useEffect(() => {
    if (submittedToken) sessionStorage.setItem(TOKEN_KEY, submittedToken);
  }, [submittedToken]);

  if (!submittedToken) {
    return <TokenGate token={token} setToken={setToken} onSubmit={() => setSubmittedToken(token)} />;
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
          <p className="text-destructive font-medium">
            {error.message === "无效的访问令牌" ? "令牌无效，请重试" : "加载失败"}
          </p>
          <button
            onClick={() => setSubmittedToken("")}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-accent transition-colors"
          >
            重新输入
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return <Dashboard data={data} />;
}

function TokenGate({
  token,
  setToken,
  onSubmit,
}: {
  token: string;
  setToken: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 px-6">
        <div className="text-center">
          <h1 className="text-2xl font-serif mb-2">数据看板</h1>
          <p className="text-sm text-muted-foreground">请输入访问令牌</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-4"
        >
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Token"
            autoFocus
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            disabled={!token}
            className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-accent transition-colors disabled:opacity-50"
          >
            进入
          </button>
        </form>
      </div>
    </div>
  );
}

type StatsData = {
  totalResponses: number;
  totalProfiles: number;
  profileStats: {
    gender: Record<string, number>;
    datingPreference: Record<string, number>;
    education: Record<string, number>;
    schoolTier: Record<string, number>;
  };
  versionStats: Record<
    string,
    {
      count: number;
      sections: {
        title: string;
        questions: {
          id: string;
          question: string;
          type: string;
          totalResponses: number;
          options: { value: string; label: string; count: number }[];
          textResponses?: string[];
        }[];
      }[];
    }
  >;
  helicopterPilots: {
    count: number;
    names: string[];
  };
  neptuneStats: {
    totalResponses: number;
    mbtiDistribution: Record<string, number>;
    zodiacDistribution: Record<string, number>;
    questionStats: {
      id: string;
      question: string;
      type: string;
      totalResponses: number;
      options: { value: string; label: string; count: number }[];
    }[];
    participants: {
      displayName: string;
      mbti: string;
      zodiac: string;
      createdAt: string;
    }[];
  };
  referralStats: Record<string, { total: number; verified: number }>;
  userList: {
    email: string;
    name: string;
    emailVerified: boolean;
    gender: string;
    datingPreference: string;
    education: string;
    schoolTier: string;
    surveyVersion: string;
    completed: boolean;
    optedIn: boolean;
    referralCode: string;
    createdAt: string;
  }[];
};

function Dashboard({ data }: { data: StatsData }) {
  const [activeVersion, setActiveVersion] = useState<string>(
    Object.keys(data.versionStats)[0] ?? "v2",
  );
  const versionData = data.versionStats[activeVersion];
  const versionIds = Object.keys(data.versionStats);

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-6 py-4">
        <h1 className="text-xl font-serif text-primary">数据看板</h1>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard label="有效问卷" value={data.totalResponses} />
          <SummaryCard label="用户档案" value={data.totalProfiles} />
          {versionIds.map((vid) => (
            <SummaryCard
              key={vid}
              label={vid === "v2" ? "v2 深度版" : "v3 快速版"}
              value={data.versionStats[vid]?.count ?? 0}
            />
          ))}
        </div>

        {/* Helicopter pilots */}
        {data.helicopterPilots.count > 0 && (
          <section className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif">武装直升机飞行员</h2>
              <span className="text-2xl font-serif text-primary">{data.helicopterPilots.count}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.helicopterPilots.names.map((name, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-full text-sm bg-primary/10 text-primary font-medium"
                >
                  {name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Referral stats */}
        {Object.keys(data.referralStats).length > 0 && (
          <ReferralTable stats={data.referralStats} />
        )}

        {/* Profile distributions */}
        <section className="space-y-6">
          <h2 className="text-lg font-serif">用户画像分布</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <DistributionTable title="性别" data={data.profileStats.gender} />
            <DistributionTable title="择偶偏好" data={data.profileStats.datingPreference} />
          </div>
        </section>

        {/* Version tabs */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b border-border">
            {versionIds.map((vid) => (
              <button
                key={vid}
                onClick={() => setActiveVersion(vid)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeVersion === vid
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {vid === "v2" ? "v2 深度版" : "v3 快速版"}
              </button>
            ))}
          </div>

          {versionData && (
            <div className="space-y-10">
              {versionData.sections.map((section) => (
                <div key={section.title} className="space-y-6">
                  <h3 className="text-base font-serif text-foreground/80">
                    {section.title}
                  </h3>
                  {section.questions.map((q) => (
                    <QuestionCard key={q.id} question={q} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Neptune challenge stats */}
        {data.neptuneStats.totalResponses > 0 && (
          <NeptuneSection stats={data.neptuneStats} />
        )}

        {/* User list */}
        <UserTable users={data.userList} />
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="text-3xl font-serif text-primary">{value}</p>
    </div>
  );
}

function DistributionTable({
  title,
  data,
}: {
  title: string;
  data: Record<string, number>;
}) {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a);
  const total = entries.reduce((sum, [, c]) => sum + c, 0);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <h4 className="font-medium text-sm">{title}</h4>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted-foreground text-left">
            <th className="px-5 py-2 font-medium">选项</th>
            <th className="px-3 py-2 font-medium text-center w-16">小计</th>
            <th className="px-5 py-2 font-medium">比例</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([label, count]) => {
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <tr key={label} className="border-t border-border/50">
                <td className="px-5 py-2.5">{label}</td>
                <td className="px-3 py-2.5 text-center">{count}</td>
                <td className="px-5 py-2.5">
                  <PercentBar pct={pct} />
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-border font-medium text-muted-foreground">
            <td className="px-5 py-2">合计</td>
            <td className="px-3 py-2 text-center">{total}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

type QuestionData = StatsData["versionStats"][string]["sections"][number]["questions"][number];

function QuestionCard({ question }: { question: QuestionData }) {
  const { question: text, type, totalResponses, options } = question;

  if (type === "open_text") {
    return (
      <OpenTextCard
        question={text}
        totalResponses={totalResponses}
        responses={question.textResponses ?? []}
      />
    );
  }

  if (type === "slider") {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <p className="text-sm font-medium leading-relaxed">{text}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            本题有效填写人次：{totalResponses}
          </p>
        </div>
        <div className="px-5 py-4">
          <SliderHistogram options={options} total={totalResponses} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <p className="text-sm font-medium leading-relaxed">{text}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          本题有效填写人次：{totalResponses}
        </p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted-foreground text-left">
            <th className="px-5 py-2 font-medium">选项</th>
            <th className="px-3 py-2 font-medium text-center w-16">小计</th>
            <th className="px-5 py-2 font-medium w-48">比例</th>
          </tr>
        </thead>
        <tbody>
          {options.map((opt) => {
            const pct = totalResponses > 0 ? (opt.count / totalResponses) * 100 : 0;
            return (
              <tr key={opt.value} className="border-t border-border/50">
                <td className="px-5 py-2.5 leading-relaxed">{opt.label}</td>
                <td className="px-3 py-2.5 text-center">{opt.count}</td>
                <td className="px-5 py-2.5">
                  <PercentBar pct={pct} />
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-border font-medium text-muted-foreground">
            <td className="px-5 py-2">合计</td>
            <td className="px-3 py-2 text-center">{totalResponses}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function OpenTextCard({
  question,
  totalResponses,
  responses,
}: {
  question: string;
  totalResponses: number;
  responses: string[];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-3 flex items-start justify-between gap-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-relaxed">{question}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            开放文本题 · 共 {totalResponses} 人填写
          </p>
        </div>
        <span className={`text-muted-foreground text-xs mt-1 shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}>
          ▶
        </span>
      </button>
      {expanded && responses.length > 0 && (
        <div className="border-t border-border max-h-80 overflow-y-auto">
          {responses.map((text, i) => (
            <div
              key={i}
              className="px-5 py-3 border-b border-border/30 last:border-b-0"
            >
              <div className="flex gap-3">
                <span className="text-xs text-muted-foreground shrink-0 mt-0.5 w-6 text-right">
                  {i + 1}.
                </span>
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SliderHistogram({
  options,
  total,
}: {
  options: { value: string; label: string; count: number }[];
  total: number;
}) {
  const maxCount = Math.max(...options.map((o) => o.count), 1);

  return (
    <div className="flex items-end gap-1 h-32">
      {options.map((opt) => {
        const heightPct = (opt.count / maxCount) * 100;
        const pct = total > 0 ? ((opt.count / total) * 100).toFixed(0) : "0";
        return (
          <div key={opt.value} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-muted-foreground">
              {opt.count > 0 ? `${pct}%` : ""}
            </span>
            <div className="w-full flex items-end" style={{ height: "80px" }}>
              <div
                className="w-full bg-primary/70 rounded-t transition-all"
                style={{ height: `${heightPct}%`, minHeight: opt.count > 0 ? "2px" : "0" }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">{opt.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function PercentBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-4 bg-muted rounded-sm overflow-hidden">
        <div
          className="h-full bg-primary/70 rounded-sm transition-all"
          style={{ width: `${Math.max(pct, 0)}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-12 text-right">
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

function ReferralTable({
  stats,
}: {
  stats: Record<string, { total: number; verified: number }>;
}) {
  const entries = Object.entries(stats).sort(([, a], [, b]) => b.total - a.total);
  const totalReferred = entries.reduce((sum, [, s]) => sum + s.total, 0);
  const totalVerified = entries.reduce((sum, [, s]) => sum + s.verified, 0);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-serif">推广渠道</h2>
        <span className="text-sm text-muted-foreground">
          共 {totalReferred} 人通过推广码注册，{totalVerified} 人已验证
        </span>
      </div>
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="px-5 py-3 font-medium">推广码</th>
              <th className="px-3 py-3 font-medium text-center w-20">注册数</th>
              <th className="px-3 py-3 font-medium text-center w-20">验证数</th>
              <th className="px-5 py-3 font-medium w-48">转化率</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([code, s]) => {
              const rate = s.total > 0 ? (s.verified / s.total) * 100 : 0;
              return (
                <tr key={code} className="border-t border-border/50">
                  <td className="px-5 py-2.5">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                      {code}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">{s.total}</td>
                  <td className="px-3 py-2.5 text-center">{s.verified}</td>
                  <td className="px-5 py-2.5">
                    <PercentBar pct={rate} />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-border font-medium text-muted-foreground">
              <td className="px-5 py-2">合计</td>
              <td className="px-3 py-2 text-center">{totalReferred}</td>
              <td className="px-3 py-2 text-center">{totalVerified}</td>
              <td className="px-5 py-2">
                <PercentBar pct={totalReferred > 0 ? (totalVerified / totalReferred) * 100 : 0} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

type UserRow = StatsData["userList"][number];

type Filters = {
  gender: Set<string>;
  datingPreference: Set<string>;
  education: Set<string>;
  schoolTier: Set<string>;
  surveyVersion: Set<string>;
  referralCode: Set<string>;
  status: Set<string>;
};

function getStatusTags(u: UserRow): string[] {
  const tags: string[] = [];
  if (u.completed) tags.push("已完成");
  if (u.optedIn) tags.push("已匹配");
  if (u.emailVerified) tags.push("已验证");
  if (!u.completed && !u.optedIn && !u.emailVerified) tags.push("未完成");
  return tags;
}

function uniqueValues(users: UserRow[], key: keyof UserRow): string[] {
  const set = new Set<string>();
  for (const u of users) {
    const v = String(u[key] || "");
    if (v) set.add(v);
  }
  return Array.from(set).sort();
}

function toggleInSet(set: Set<string>, value: string): Set<string> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function FilterGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: Set<string>;
  onToggle: (v: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-muted-foreground shrink-0 pt-1 w-10">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
              selected.has(opt)
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function UserTable({ users }: { users: UserRow[] }) {
  const [expanded, setExpanded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    gender: new Set(),
    datingPreference: new Set(),
    education: new Set(),
    schoolTier: new Set(),
    surveyVersion: new Set(),
    referralCode: new Set(),
    status: new Set(),
  });
  const router = useRouter();

  const activeCount = Object.values(filters).reduce((sum, s) => sum + s.size, 0);

  const filtered = users.filter((u) => {
    if (filters.gender.size > 0 && !filters.gender.has(u.gender || "")) return false;
    if (filters.datingPreference.size > 0 && !filters.datingPreference.has(u.datingPreference || "")) return false;
    if (filters.education.size > 0 && !filters.education.has(u.education || "")) return false;
    if (filters.schoolTier.size > 0 && !filters.schoolTier.has(u.schoolTier || "")) return false;
    if (filters.surveyVersion.size > 0 && !filters.surveyVersion.has(u.surveyVersion || "")) return false;
    if (filters.referralCode.size > 0 && !filters.referralCode.has(u.referralCode || "")) return false;
    if (filters.status.size > 0) {
      const tags = getStatusTags(u);
      if (!tags.some((t) => filters.status.has(t))) return false;
    }
    return true;
  });

  const clearFilters = () =>
    setFilters({
      gender: new Set(),
      datingPreference: new Set(),
      education: new Set(),
      schoolTier: new Set(),
      surveyVersion: new Set(),
      referralCode: new Set(),
      status: new Set(),
    });

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-lg font-serif hover:text-primary transition-colors"
        >
          <span className={`transition-transform ${expanded ? "rotate-90" : ""}`}>
            ▶
          </span>
          用户明细（{filtered.length === users.length ? `共 ${users.length} 人` : `${filtered.length} / ${users.length} 人`}）
        </button>
        {expanded && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1 rounded-full text-xs transition-colors ${
              showFilters || activeCount > 0
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            筛选{activeCount > 0 ? ` (${activeCount})` : ""}
          </button>
        )}
      </div>

      {expanded && showFilters && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">筛选条件</span>
            {activeCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                清除全部
              </button>
            )}
          </div>
          <FilterGroup
            label="性别"
            options={uniqueValues(users, "gender")}
            selected={filters.gender}
            onToggle={(v) => setFilters((f) => ({ ...f, gender: toggleInSet(f.gender, v) }))}
          />
          <FilterGroup
            label="择偶"
            options={uniqueValues(users, "datingPreference")}
            selected={filters.datingPreference}
            onToggle={(v) => setFilters((f) => ({ ...f, datingPreference: toggleInSet(f.datingPreference, v) }))}
          />
          <FilterGroup
            label="学历"
            options={uniqueValues(users, "education")}
            selected={filters.education}
            onToggle={(v) => setFilters((f) => ({ ...f, education: toggleInSet(f.education, v) }))}
          />
          <FilterGroup
            label="院校"
            options={uniqueValues(users, "schoolTier")}
            selected={filters.schoolTier}
            onToggle={(v) => setFilters((f) => ({ ...f, schoolTier: toggleInSet(f.schoolTier, v) }))}
          />
          <FilterGroup
            label="版本"
            options={uniqueValues(users, "surveyVersion")}
            selected={filters.surveyVersion}
            onToggle={(v) => setFilters((f) => ({ ...f, surveyVersion: toggleInSet(f.surveyVersion, v) }))}
          />
          <FilterGroup
            label="来源"
            options={uniqueValues(users, "referralCode")}
            selected={filters.referralCode}
            onToggle={(v) => setFilters((f) => ({ ...f, referralCode: toggleInSet(f.referralCode, v) }))}
          />
          <FilterGroup
            label="状态"
            options={["已完成", "已匹配", "已验证", "未完成"]}
            selected={filters.status}
            onToggle={(v) => setFilters((f) => ({ ...f, status: toggleInSet(f.status, v) }))}
          />
        </div>
      )}

      {expanded && (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">昵称</th>
                <th className="px-4 py-3 font-medium">邮箱</th>
                <th className="px-4 py-3 font-medium">性别</th>
                <th className="px-4 py-3 font-medium">择偶</th>
                <th className="px-4 py-3 font-medium">学历</th>
                <th className="px-4 py-3 font-medium">院校</th>
                <th className="px-4 py-3 font-medium">版本</th>
                <th className="px-4 py-3 font-medium">来源</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">注册时间</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.email} className="border-t border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2.5 font-medium">
                    <button
                      onClick={() => router.push(`/metrics/user?email=${encodeURIComponent(u.email)}`)}
                      className="text-primary hover:underline underline-offset-2 cursor-pointer"
                    >
                      {u.name || u.email.split("@")[0]}
                    </button>
                  </td>
                  <td className="px-4 py-2.5">{u.email}</td>
                  <td className="px-4 py-2.5">{u.gender || "-"}</td>
                  <td className="px-4 py-2.5">{u.datingPreference || "-"}</td>
                  <td className="px-4 py-2.5">{u.education || "-"}</td>
                  <td className="px-4 py-2.5">{u.schoolTier || "-"}</td>
                  <td className="px-4 py-2.5">{u.surveyVersion || "-"}</td>
                  <td className="px-4 py-2.5">
                    {u.referralCode ? (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">
                        {u.referralCode}
                      </span>
                    ) : "-"}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1.5">
                      {u.completed && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">已完成</span>
                      )}
                      {u.optedIn && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">已匹配</span>
                      )}
                      {u.emailVerified && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">已验证</span>
                      )}
                      {!u.completed && !u.optedIn && !u.emailVerified && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">未完成</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}{" "}{new Date(u.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function NeptuneSection({ stats }: { stats: StatsData["neptuneStats"] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-serif flex items-center gap-2">
          <span>🔱</span> 海王星挑战
        </h2>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
          {stats.totalResponses} 人参与
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <DistributionTable title="MBTI 分布" data={stats.mbtiDistribution} />
        <DistributionTable title="星座分布" data={stats.zodiacDistribution} />
      </div>

      <div className="space-y-6">
        <h3 className="text-base font-serif text-foreground/80">答题分布</h3>
        {stats.questionStats.map((q) => (
          <QuestionCard key={q.id} question={q} />
        ))}
      </div>

      {stats.participants.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
          >
            <span className={`transition-transform ${expanded ? "rotate-90" : ""}`}>▶</span>
            参与者明细（{stats.participants.length} 人）
          </button>

          {expanded && (
            <div className="mt-3 bg-card rounded-2xl border border-border shadow-sm overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">昵称</th>
                    <th className="px-4 py-3 font-medium">MBTI</th>
                    <th className="px-4 py-3 font-medium">星座</th>
                    <th className="px-4 py-3 font-medium">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.participants.map((p, i) => (
                    <tr key={i} className="border-t border-border/50">
                      <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-2.5 font-medium">{p.displayName}</td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700">
                          {p.mbti || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">{p.zodiac || "-"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}{" "}
                        {new Date(p.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
