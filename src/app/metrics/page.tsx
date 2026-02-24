"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function MetricsPage() {
  const [token, setToken] = useState("");
  const [submittedToken, setSubmittedToken] = useState("");

  const { data, isLoading, error } = trpc.analytics.getStats.useQuery(
    { token: submittedToken },
    { enabled: submittedToken.length > 0, retry: false },
  );

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
        }[];
      }[];
    }
  >;
  helicopterPilots: {
    count: number;
    names: string[];
  };
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
      <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
        <p className="text-sm font-medium mb-2 leading-relaxed">{text}</p>
        <p className="text-sm text-muted-foreground">
          开放文本题 · 共 <span className="text-foreground font-medium">{totalResponses}</span> 人填写
        </p>
      </div>
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

type UserRow = StatsData["userList"][number];

function UserTable({ users }: { users: UserRow[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="space-y-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-lg font-serif hover:text-primary transition-colors"
      >
        <span className={`transition-transform ${expanded ? "rotate-90" : ""}`}>
          ▶
        </span>
        用户明细（共 {users.length} 人）
      </button>

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
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">注册时间</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.email} className="border-t border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2.5 font-medium">{u.name || "-"}</td>
                  <td className="px-4 py-2.5">{u.email}</td>
                  <td className="px-4 py-2.5">{u.gender || "-"}</td>
                  <td className="px-4 py-2.5">{u.datingPreference || "-"}</td>
                  <td className="px-4 py-2.5">{u.education || "-"}</td>
                  <td className="px-4 py-2.5">{u.schoolTier || "-"}</td>
                  <td className="px-4 py-2.5">{u.surveyVersion || "-"}</td>
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
                    {new Date(u.createdAt).toLocaleDateString("zh-CN")}
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
