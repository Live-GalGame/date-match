"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface AnonymousCard {
  matchId: string;
  compatibility: number;
  reasons: string[];
  aiInsight: string | null;
  status: string;
  myScore: number | null;
  profile: {
    ageRange: string;
    gender: string;
    educationLevel: string;
    schoolTier: string;
    surveyHighlights: Record<string, string>;
  };
}

const RATING_EMOJIS = ["😟", "😐", "🙂", "😊", "🥰"];
const RATING_LABELS = ["不来电", "一般", "还行", "心动", "超期待"];

const GENDER_MAP: Record<string, string> = {
  male: "男生",
  female: "女生",
  "non-binary": "非二元",
  other: "其他",
};

function MatchCard({
  card,
  index,
  onRate,
}: {
  card: AnonymousCard;
  index: number;
  onRate: (matchId: string, score: number) => Promise<{ mutual: boolean; message: string } | null>;
}) {
  const [rating, setRating] = useState<number | null>(card.myScore);
  const [submitting, setSubmitting] = useState(false);
  const [mutualResult, setMutualResult] = useState<{ mutual: boolean; message: string } | null>(null);
  const isRevealed = card.status === "revealed";

  const handleRate = useCallback(
    async (score: number) => {
      if (submitting) return;
      setRating(score);
      setSubmitting(true);
      try {
        const result = await onRate(card.matchId, score);
        if (result) setMutualResult(result);
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, onRate, card.matchId],
  );

  const highlights = Object.entries(card.profile.surveyHighlights);

  return (
    <div
      className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden animate-fade-in"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-lg">
            {isRevealed ? "💕" : "🎭"}
          </div>
          <div>
            <p className="font-serif text-lg">
              匿名对象 #{index + 1}
            </p>
            <p className="text-xs text-muted-foreground">
              {GENDER_MAP[card.profile.gender.toLowerCase()] ?? card.profile.gender}
              {card.profile.ageRange !== "未填写" && ` · ${card.profile.ageRange}岁`}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-serif text-primary">{card.compatibility}%</div>
          <div className="text-xs text-muted-foreground">契合度</div>
        </div>
      </div>

      {/* Profile badges */}
      <div className="px-6 flex flex-wrap gap-2 mb-4">
        {card.profile.educationLevel && card.profile.educationLevel !== "未填写" && (
          <span className="px-2.5 py-1 rounded-full bg-muted text-xs text-muted-foreground">
            🎓 {card.profile.educationLevel}
          </span>
        )}
        {card.profile.schoolTier && card.profile.schoolTier !== "未填写" && (
          <span className="px-2.5 py-1 rounded-full bg-muted text-xs text-muted-foreground">
            🏫 {card.profile.schoolTier}
          </span>
        )}
      </div>

      {/* Survey highlights */}
      {highlights.length > 0 && (
        <div className="px-6 mb-4">
          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            {highlights.map(([key, value]) => (
              <div key={key} className="flex items-start gap-2 text-sm">
                <span className="text-primary shrink-0 font-medium">{key}：</span>
                <span className="text-muted-foreground">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reasons */}
      <div className="px-6 mb-4">
        <p className="text-sm font-medium mb-2">匹配原因</p>
        <ul className="space-y-1.5">
          {card.reasons.map((reason, i) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
              <span className="text-primary shrink-0">•</span>
              {reason}
            </li>
          ))}
        </ul>
      </div>

      {/* AI insight */}
      {card.aiInsight && (
        <div className="mx-6 mb-4 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border-l-4 border-primary">
          <p className="text-xs font-semibold text-primary mb-1">✨ AI 牵线语</p>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {card.aiInsight}
          </p>
        </div>
      )}

      {/* Mutual match celebration */}
      {mutualResult?.mutual && (
        <div className="mx-6 mb-4 p-4 rounded-xl bg-gradient-to-r from-pink-100 to-rose-100 text-center">
          <p className="text-lg mb-1">🎉</p>
          <p className="text-sm font-semibold text-primary">{mutualResult.message}</p>
        </div>
      )}

      {/* Rating */}
      <div className="px-6 pb-6 pt-2 border-t border-border/50">
        {rating !== null && !mutualResult ? (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              你的评分：{RATING_EMOJIS[rating - 1]} {RATING_LABELS[rating - 1]}
            </p>
            <button
              onClick={() => setRating(null)}
              className="text-xs text-primary underline"
            >
              修改评分
            </button>
          </div>
        ) : !mutualResult ? (
          <>
            <p className="text-sm text-center text-muted-foreground mb-3">TA 让你心动吗？</p>
            <div className="flex justify-center gap-1.5">
              {RATING_EMOJIS.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => handleRate(i + 1)}
                  disabled={submitting}
                  className="flex flex-col items-center gap-0.5 p-2.5 rounded-xl hover:bg-muted transition-all active:scale-95 disabled:opacity-50"
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-[10px] text-muted-foreground">{RATING_LABELS[i]}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              双方都打 4 星以上 → 自动互相揭示身份 ✨
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function BlindDatePage() {
  const params = useSearchParams();
  const userId = params.get("u");
  const token = params.get("t");
  const week = params.get("w");

  const [cards, setCards] = useState<AnonymousCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isValid = !!userId && !!token && !!week;

  useEffect(() => {
    if (!isValid) return;
    (async () => {
      try {
        const res = await fetch(`/api/blind-date?u=${userId}&t=${token}&w=${week}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError((data as { error?: string }).error ?? "加载失败");
          return;
        }
        const data = (await res.json()) as { cards: AnonymousCard[] };
        setCards(data.cards);
      } catch {
        setError("网络错误，请稍后重试");
      } finally {
        setLoading(false);
      }
    })();
  }, [isValid, userId, token, week]);

  const handleRate = useCallback(
    async (matchId: string, score: number): Promise<{ mutual: boolean; message: string } | null> => {
      if (!userId || !token) return null;
      try {
        const res = await fetch("/api/blind-date", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, token, matchId, score }),
        });
        if (!res.ok) return null;
        return (await res.json()) as { mutual: boolean; message: string };
      } catch {
        return null;
      }
    },
    [userId, token],
  );

  if (!isValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-xl font-serif text-primary mb-2">链接无效</h1>
          <p className="text-muted-foreground text-sm">请通过匹配通知邮件中的链接访问此页面。</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">加载匿名匹配中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-5xl mb-4">😢</div>
          <h1 className="text-xl font-serif text-primary mb-2">出了点问题</h1>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-xs">
          <div className="text-5xl mb-4">🫧</div>
          <h1 className="text-xl font-serif text-primary mb-2">暂无匿名匹配</h1>
          <p className="text-muted-foreground text-sm">本周还没有为你生成匿名匹配，请等待下一轮。</p>
        </div>
      </div>
    );
  }

  const ratedCount = cards.filter((c) => c.myScore !== null).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <Link href="/" className="text-2xl font-serif text-primary">
            date match.
          </Link>
          <p className="text-muted-foreground text-sm mt-1">{week} · 匿名盲盒匹配</p>
        </div>

        {/* Info card */}
        <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-5 mb-6 border border-primary/10 animate-fade-in">
          <h1 className="text-lg font-serif mb-2">你有 {cards.length} 个匿名匹配 🎲</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            浏览每位匿名对象的档案，给TA打个分。如果<strong className="text-foreground">双方都打了 4 星以上</strong>，系统会自动为你们揭晓身份。你的评分完全保密。
          </p>
          {ratedCount > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${(ratedCount / cards.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {ratedCount}/{cards.length} 已评分
              </span>
            </div>
          )}
        </div>

        {/* Cards */}
        <div className="space-y-4">
          {cards.map((card, i) => (
            <MatchCard key={card.matchId} card={card} index={i} onRate={handleRate} />
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-xs text-muted-foreground">
            💡 双向奔赴机制：只有双方都给彼此打了高分，才会互相揭示联系方式
          </p>
          <Link href="/" className="text-xs text-primary underline">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
