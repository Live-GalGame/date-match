"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { cn } from "@/lib/utils";
import { TURNSTILE_SITE_KEY } from "./survey-types";

interface EmailStepProps {
  hasLiteData: boolean;
  displayName: string;
  setDisplayName: (v: string) => void;
  education: string;
  setEducation: (v: string) => void;
  schoolTier: string;
  setSchoolTier: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  honeypot: string;
  setHoneypot: (v: string) => void;
  turnstileRef: React.RefObject<TurnstileInstance | null>;
  setTurnstileToken: (v: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  isPending: boolean;
  error: boolean;
}

export function EmailStep({
  hasLiteData,
  displayName, setDisplayName,
  education, setEducation,
  schoolTier, setSchoolTier,
  email, setEmail,
  honeypot, setHoneypot,
  turnstileRef, setTurnstileToken,
  onBack, onSubmit,
  isPending, error,
}: EmailStepProps) {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>最后一步</span>
          <span>99%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: "99%" }} />
        </div>
      </div>

      {hasLiteData && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-6 flex items-center gap-2">
          <span className="text-primary text-sm font-medium">✓</span>
          <span className="text-sm text-primary">快速版 + 深度版答案已合并，信息已自动填入</span>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-serif mb-3">差最后一步！</h1>
        <p className="text-muted-foreground">
          {hasLiteData ? "确认你的信息无误，即可提交。" : "留下你的邮箱和昵称，我们会把匹配结果发送给你。"}
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium mb-2">你的昵称</label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="你希望被怎样称呼？"
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">最高学历</label>
          <div className="grid grid-cols-4 gap-2">
            {(["高中", "本科", "硕士", "博士"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setEducation(opt)}
                className={cn(
                  "py-2.5 rounded-xl border text-sm font-medium transition-all",
                  education === opt ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:border-primary/40"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">请填写你目前已取得或正在就读的最高学历（在读也算）</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">院校层级</label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: "清北", label: "清北", sub: "清华 / 北大" },
              { value: "C9", label: "C9", sub: "复旦、交大、浙大等" },
              { value: "985", label: "985", sub: "或 QS 前 50" },
              { value: "211", label: "211", sub: "或 QS 前 100" },
              { value: "一本", label: "一本", sub: "或 QS 前 300" },
              { value: "其他", label: "其他", sub: "二本 / 专科 / 海外其他" },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSchoolTier(opt.value)}
                className={cn(
                  "py-2.5 px-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center gap-0.5",
                  schoolTier === opt.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:border-primary/40"
                )}
              >
                <span>{opt.label}</span>
                <span className={cn("text-xs font-normal", schoolTier === opt.value ? "text-primary/70" : "text-muted-foreground")}>{opt.sub}</span>
              </button>
            ))}
          </div>
          {education === "高中" && (
            <p className="text-xs text-muted-foreground mt-2">高中生可选「其他」，不影响匹配</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">海外院校请参考 QS 排名对应选择；在读请选当前就读院校层级</p>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">邮箱地址</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
          />
          <p className="text-xs text-muted-foreground mt-2">匹配结果将发送到此邮箱，请确保填写正确</p>
        </div>

        {/* Honeypot */}
        <div className="absolute opacity-0 -z-10 h-0 overflow-hidden" aria-hidden="true">
          <input tabIndex={-1} autoComplete="off" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </div>

        {TURNSTILE_SITE_KEY && (
          <div className="flex justify-center">
            <Turnstile
              ref={turnstileRef}
              siteKey={TURNSTILE_SITE_KEY}
              onSuccess={(token) => setTurnstileToken(token)}
              onExpire={() => setTurnstileToken("")}
              onError={() => setTurnstileToken("")}
            />
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-10">
        <button type="button" onClick={onBack} className="flex-1 py-3 rounded-full border border-border text-foreground font-medium hover:bg-muted transition-colors">
          上一步
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isPending || !email || !displayName || !education || !schoolTier}
          className="flex-1 py-3 rounded-full bg-primary text-primary-foreground font-medium text-lg hover:bg-accent transition-colors disabled:opacity-50"
        >
          {isPending ? "提交中..." : "提交问卷"}
        </button>
      </div>

      {error && (
        <p className="text-destructive text-sm mt-4 text-center">
          提交失败，请重试。如果问题持续存在，请联系{" "}
          <a href="mailto:hzy2210@gmail.com" className="underline hover:opacity-80">hzy2210@gmail.com</a>
        </p>
      )}
    </div>
  );
}
