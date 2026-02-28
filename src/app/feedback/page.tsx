"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const EMOJIS = ["😟", "😐", "🙂", "😊", "🥰"];
const LABELS = ["不合适", "一般", "还行", "不错", "超期待"];

const ISSUE_TAGS = [
  "兴趣爱好差异大",
  "性格不合",
  "距离/城市不匹配",
  "年龄差距太大",
  "感觉聊不来",
  "对方信息太少",
  "三观不合",
  "匹配理由不准确",
];

function FeedbackContent() {
  const params = useSearchParams();
  const matchId = params.get("m");
  const userId = params.get("u");
  const token = params.get("t");
  const savedScore = params.get("saved");

  const [score, setScore] = useState<number>(savedScore ? parseInt(savedScore, 10) : 0);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [wantRematch, setWantRematch] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isValid = !!matchId && !!userId && !!token;

  const handleSubmit = useCallback(async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          userId,
          token,
          score: score || undefined,
          issues: selectedIssues.length > 0 ? selectedIssues : undefined,
          comment: comment.trim() || undefined,
          wantRematch,
        }),
      });
      if (res.ok) setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }, [isValid, submitting, matchId, userId, token, score, selectedIssues, comment, wantRematch]);

  // Scroll to top when page loads with saved score
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!isValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-xl font-serif text-primary mb-2">链接无效</h1>
          <p className="text-muted-foreground text-sm">请通过匹配邮件中的链接访问此页面。</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-2xl p-8 border border-border shadow-sm text-center animate-fade-in">
          <div className="text-5xl mb-4">💌</div>
          <h1 className="text-2xl font-serif text-primary mb-3">感谢你的反馈！</h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            {wantRematch
              ? "我们已收到你的重新匹配申请，会在下一轮匹配中优先为你寻找更合适的对象。"
              : "你的反馈对我们非常重要，我们会不断优化匹配算法，为你找到更合适的人。"}
          </p>
          <Link
            href="/"
            className="inline-block py-2.5 px-6 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-accent transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <Link href="/" className="text-2xl font-serif text-primary">
            date match.
          </Link>
          <p className="text-muted-foreground text-sm mt-2">匹配反馈</p>
        </div>

        {/* Score confirmation / selection */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm mb-4 animate-fade-in">
          <h2 className="text-lg font-serif mb-1">这次匹配你满意吗？</h2>
          <p className="text-muted-foreground text-xs mb-5">
            {savedScore ? "已记录你的快速评分，也可以在这里修改" : "选择一个表情来表达你的感受"}
          </p>

          <div className="flex justify-center gap-2">
            {EMOJIS.map((emoji, i) => {
              const s = i + 1;
              const active = score === s;
              return (
                <button
                  key={s}
                  onClick={() => setScore(s)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                    active
                      ? "bg-primary/10 ring-2 ring-primary scale-110"
                      : "hover:bg-muted"
                  }`}
                >
                  <span className="text-3xl">{emoji}</span>
                  <span className={`text-xs ${active ? "text-primary font-medium" : "text-muted-foreground"}`}>
                    {LABELS[i]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Issue tags (shown when score <= 3) */}
        {score > 0 && score <= 3 && (
          <div className="bg-card rounded-2xl p-6 border border-border shadow-sm mb-4 animate-fade-in">
            <h3 className="text-base font-serif mb-1">哪些方面不太满意？</h3>
            <p className="text-muted-foreground text-xs mb-4">可多选，帮助我们改进</p>

            <div className="flex flex-wrap gap-2">
              {ISSUE_TAGS.map((tag) => {
                const active = selectedIssues.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() =>
                      setSelectedIssues((prev) =>
                        active ? prev.filter((t) => t !== tag) : [...prev, tag],
                      )
                    }
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Free text */}
        {score > 0 && (
          <div className="bg-card rounded-2xl p-6 border border-border shadow-sm mb-4 animate-fade-in">
            <h3 className="text-base font-serif mb-1">还有什么想说的？</h3>
            <p className="text-muted-foreground text-xs mb-3">选填，你的建议会帮助我们变得更好</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="比如：希望匹配同城的、更关注性格互补..."
              maxLength={500}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{comment.length}/500</p>
          </div>
        )}

        {/* Re-match request */}
        {score > 0 && score <= 3 && (
          <div
            className="bg-card rounded-2xl px-6 py-4 border border-border shadow-sm mb-6 animate-fade-in cursor-pointer"
            onClick={() => setWantRematch(!wantRematch)}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                  wantRematch ? "bg-primary border-primary" : "border-border"
                }`}
              >
                {wantRematch && (
                  <svg className="w-3 h-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-medium">希望重新匹配</p>
                <p className="text-xs text-muted-foreground">下一轮我们会优先为你寻找更合适的人</p>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        {score > 0 && (
          <div className="animate-fade-in">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "提交中..." : "提交反馈"}
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Date Match — 不靠刷脸，靠灵魂找到你的人。
        </p>
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <FeedbackContent />
    </Suspense>
  );
}
