import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "加入我们 | Date Match 招聘全栈工程师",
  description:
    "Date Match 正在招聘全栈工程师，参与心理学匹配平台的核心开发。Next.js + tRPC + PostgreSQL 技术栈，远程友好，接受在读生和应届生。",
};

const techStack = [
  { category: "框架", items: ["Next.js 16 (App Router)", "React 19"] },
  { category: "样式", items: ["Tailwind CSS 4", "shadcn/ui (Radix)"] },
  { category: "API", items: ["tRPC 11", "React Query 5"] },
  { category: "数据", items: ["Prisma 7", "PostgreSQL (Railway)"] },
  { category: "AI", items: ["OpenAI 兼容 LLM API", "匹配算法引擎"] },
  { category: "部署", items: ["Vercel Serverless", "GitHub Actions CI/CD"] },
];

const responsibilities = [
  "设计与开发新的问卷题型和版本，从定义到 UI 到评分器全流程",
  "搭建和优化 tRPC API 层，保证前后端类型安全和性能",
  // "优化 LLM 集成管线——AI 牵线文案生成、破冰话题推荐",
  // "参与数据分析和 RLHF 反馈闭环，用数据驱动匹配质量提升",
  "构建用户增长工具——邀请码体系、分享海报、社交裂变功能",
  "关注 Web 性能和用户体验，确保移动端和桌面端的极致体验",
];

const requirements = [
  { label: "必备", items: [
    "1 年以上 React / Next.js 实际项目经验",
    "熟悉 TypeScript，能写类型安全的代码",
    "理解关系型数据库基础（SQL、索引、事务）",
    "用过至少一种 ORM（Prisma / Drizzle / TypeORM 等）",
    "有前后端联调的完整开发经验",
    "自驱力强，能独立推动功能从 0 到 1",
  ]},
  { label: "加分项", items: [
    "了解 tRPC 或类似的端到端类型安全方案",
    "有推荐系统或匹配算法的背景",
    "熟悉 Vercel / Cloudflare 等 Serverless 部署平台",
    "有开源贡献经验或个人项目作品",
    "对心理学、社会科学、用户行为分析有兴趣",
  ]},
];

const perks = [
  { icon: "🌍", title: "全远程", desc: "不限地点，灵活工作时间" },
  { icon: "🧠", title: "技术驱动", desc: "用最新技术栈解决真实问题" },
  { icon: "🤝", title: "大厂基因", desc: "腾讯、字节、蚂蚁核心成员，体系化做事" },
  { icon: "📈", title: "快速成长", desc: "早期团队成员，参与核心架构决策" },
  { icon: "🎯", title: "有意义的产品", desc: "帮助真实的人建立深层连接" },
  { icon: "💡", title: "开源基因", desc: "2500+ Star 开源项目团队，鼓励分享和技术写作" },
];

export default function HirePage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="hero-gradient text-white">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24 text-center">
          <Link
            href="/"
            className="inline-block mb-8 text-sm text-white/60 hover:text-white/90 transition-colors"
          >
            ← 返回首页
          </Link>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif leading-tight mb-4">
            加入 Date Match
            <br />
            <span className="text-white/80">一起造有温度的产品</span>
          </h1>
          <p className="text-base sm:text-lg text-white/60 max-w-xl mx-auto mb-6">
            我们是{" "}
            <a
              href="https://github.com/Live-GalGame/LiveGalGame"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/90 underline underline-offset-4 decoration-white/30 hover:decoration-white/60 transition-colors"
            >
              LiveGalGame（2500+ Star）
            </a>
            {" "}同团队，来自腾讯、字节、蚂蚁等头部大厂的核心工程师。
            正在寻找一位全栈工程师，一起把这个高增长项目做大。
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16 space-y-16">
        {/* 关于团队 */}
        <section>
          <SectionTitle>关于团队</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl border border-border bg-card p-5 text-center">
              <div className="text-2xl mb-2">⭐</div>
              <div className="text-lg font-semibold text-card-foreground">2500+ Star</div>
              <div className="text-xs text-muted-foreground mt-1">
                <a
                  href="https://github.com/Live-GalGame/LiveGalGame"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  LiveGalGame
                </a>
                {" "}开源项目同团队
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 text-center">
              <div className="text-2xl mb-2">🏢</div>
              <div className="text-lg font-semibold text-card-foreground">头部大厂</div>
              <div className="text-xs text-muted-foreground mt-1">核心成员来自腾讯、字节、蚂蚁</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 text-center">
              <div className="text-2xl mb-2">🚀</div>
              <div className="text-lg font-semibold text-card-foreground">高增长孵化</div>
              <div className="text-xs text-muted-foreground mt-1">已上线运营，用户持续增长中</div>
            </div>
          </div>
          <p className="text-sm text-foreground/70 leading-relaxed">
            我们是一支大厂背景、为爱发电的团队，之前一起做了 GitHub 上 2500+ Star 的开源项目{" "}
            <a
              href="https://github.com/Live-GalGame/LiveGalGame"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              LiveGalGame
            </a>
            。现在我们正在孵化 Date Match——一个增长势头强劲的关系兼容性匹配平台，
            用心理学和 AI 帮助真实的人建立深层连接。
          </p>
        </section>

        {/* 关于项目 */}
        <section>
          <SectionTitle>关于项目</SectionTitle>
          <div className="space-y-4 text-sm text-foreground/70 leading-relaxed">
            <p>
              <strong className="text-foreground">Date Match</strong> 是一个关系兼容性匹配平台。
              用户无需注册即可填写基于心理学理论的深度问卷，系统通过六维度兼容性算法计算匹配度，
              每周为用户推荐一位高兼容性的匹配对象。
            </p>
            <p>
              匹配管线分两阶段：Stage 1 规则引擎初筛（心理学互补矩阵 + Deal-breaker 硬过滤 + 全局最大权匹配），
              Stage 2 LLM 精筛（AI 牵线文案 + 破冰话题）。产品已上线运营，有真实用户数据和 RLHF 反馈闭环。
            </p>
          </div>
        </section>

        {/* 技术栈 */}
        <section>
          <SectionTitle>技术栈</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {techStack.map((group) => (
              <div key={group.category} className="rounded-xl border border-border bg-card p-4">
                <div className="text-xs font-medium text-muted-foreground mb-2">{group.category}</div>
                {group.items.map((item) => (
                  <div key={item} className="text-sm text-card-foreground">{item}</div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* 你将做什么 */}
        <section>
          <SectionTitle>你将做什么</SectionTitle>
          <ul className="space-y-3">
            {responsibilities.map((item) => (
              <li key={item} className="flex gap-3 text-sm sm:text-base text-foreground/80">
                <span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-accent" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* 我们期望 */}
        <section>
          <SectionTitle>我们期望</SectionTitle>
          <div className="space-y-8">
            {requirements.map((group) => (
              <div key={group.label}>
                <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                  <span className={
                    group.label === "必备"
                      ? "inline-block h-2 w-2 rounded-full bg-accent"
                      : "inline-block h-2 w-2 rounded-full bg-amber-400"
                  } />
                  {group.label}
                </h3>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm text-foreground/70">
                      <span className="shrink-0 text-muted-foreground">·</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* 为什么选择我们 */}
        <section>
          <SectionTitle>为什么选择我们</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {perks.map((perk) => (
              <div key={perk.title} className="flex gap-4 rounded-xl border border-border bg-card p-4">
                <span className="text-2xl shrink-0">{perk.icon}</span>
                <div>
                  <div className="font-medium text-sm text-card-foreground">{perk.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{perk.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 如何申请 */}
        <section className="rounded-2xl border border-border bg-card p-6 sm:p-8 text-center">
          <h2 className="text-xl sm:text-2xl font-serif text-card-foreground mb-3">感兴趣？</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            发送你的简历、GitHub / 作品集链接到下方邮箱，简单聊聊你对这个项目的想法。
            没有固定格式要求，真诚就好。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="mailto:hzy2210@gmail.com?subject=全栈工程师申请 - [你的名字]"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
            >
              📮 hzy2210@gmail.com
            </a>
            <a
              href="mailto:chenspeculation@foxmail.com?subject=全栈工程师申请 - [你的名字]"
              className="inline-flex items-center gap-2 rounded-full border border-primary px-8 py-3 text-primary font-medium text-sm hover:bg-primary/5 transition-colors"
            >
              📮 chenspeculation@foxmail.com
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            任意一个邮箱均可
          </p>
        </section>

        <div className="text-center pb-8">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl sm:text-2xl font-serif text-foreground mb-6 flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span>{children}</span>
      <span className="h-px flex-1 bg-border" />
    </h2>
  );
}
