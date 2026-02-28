"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";

interface SurveyHighlights {
  [key: string]: string;
}

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
    surveyHighlights: SurveyHighlights;
  };
}

const EMOJIS = ["", "😟", "😐", "🙂", "😊", "🥰"];
const LABELS = ["", "没感觉", "一般", "有点兴趣", "挺感兴趣", "非常想认识"];

function BlindDateCards() {
  const params = useSearchParams();
  const userId = params.get("u") ?? "";
  const token = params.get("t") ?? "";
  const week = params.get("w") ?? "";

  const [cards, setCards] = useState<AnonymousCard[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; mutual: boolean } | null>(null);

  const showToast = useCallback((msg: string, mutual: boolean) => {
    setToast({ msg, mutual });
    setTimeout(() => setToast(null), 5000);
  }, []);

  useEffect(() => {
    if (!userId || !token || !week) { setStatus("error"); return; }
    fetch(`/api/blind-date?u=${userId}&t=${token}&w=${week}`)
      .then((r) => r.json())
      .then((d: { cards?: AnonymousCard[]; error?: string }) => {
        if (d.error) { setStatus("error"); return; }
        setCards(d.cards ?? []);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [userId, token, week]);

  const submit = async (matchId: string, score: number) => {
    setSubmitting(matchId);
    try {
      const res = await fetch("/api/blind-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, token, matchId, score }),
      });
      const d = (await res.json()) as { mutual?: boolean; message?: string; error?: string };
      if (d.error) { showToast(d.error, false); return; }
      setCards((prev) => prev.map((c) => c.matchId === matchId ? { ...c, myScore: score } : c));
      showToast(d.message ?? "已记录", d.mutual ?? false);
    } finally {
      setSubmitting(null);
    }
  };

  if (!userId || !token || !week || status === "error") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#fdf6f0]">
        <p className="text-muted-foreground">链接无效或已过期</p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#fdf6f0]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#8b2252] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#fdf6f0]">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-2xl px-5 py-3 text-sm font-medium shadow-lg transition-all ${toast.mutual ? "bg-[#8b2252] text-white" : "bg-white text-[#2d1b14]"}`}>
          {toast.msg}
        </div>
      )}

      <header className="sticky top-0 z-10 border-b border-border/40 bg-white/80 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-serif text-lg font-semibold text-[#8b2252]">date match.</h1>
          <p className="text-xs text-muted-foreground">{week} · 本周匿名匹配 · {cards.length} 位</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        {cards.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">本周暂无匿名匹配</div>
        )}

        {cards.map((card) => (
          <div key={card.matchId} className="overflow-hidden rounded-2xl bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/30 px-5 py-4">
              <div>
                <span className="text-2xl font-bold text-[#8b2252]">{card.compatibility}%</span>
                <span className="ml-1.5 text-sm text-muted-foreground">兼容度</span>
              </div>
              {card.myScore && (
                <span className="text-xl" title={LABELS[card.myScore]}>{EMOJIS[card.myScore]}</span>
              )}
            </div>

            <div className="space-y-4 p-5">
              {/* Profile basics */}
              <div className="flex flex-wrap gap-2">
                {[card.profile.gender, card.profile.ageRange, card.profile.educationLevel, card.profile.schoolTier]
                  .filter((v) => v && v !== "未填写")
                  .map((v) => (
                    <span key={v} className="rounded-full bg-[#fdf0f5] px-3 py-0.5 text-xs font-medium text-[#8b2252]">{v}</span>
                  ))}
              </div>

              {/* Match reasons */}
              {card.reasons.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-muted-foreground">匹配原因</p>
                  <ul className="space-y-1">
                    {card.reasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm text-[#6b5449]">
                        <span className="mt-0.5 text-[#8b2252]">•</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Survey highlights */}
              {Object.keys(card.profile.surveyHighlights).length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Ta 的问卷亮点</p>
                  <div className="space-y-1.5">
                    {Object.entries(card.profile.surveyHighlights).map(([k, v]) => (
                      <div key={k} className="rounded-xl bg-[#fdf6f0] px-3 py-2 text-sm">
                        <span className="font-medium text-[#8b2252]">{k}：</span>
                        <span className="text-[#6b5449]">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI insight */}
              {card.aiInsight && (
                <div className="rounded-xl border border-[#8b2252]/10 bg-gradient-to-br from-[#fff0f5] to-[#f8f0ff] p-4">
                  <p className="mb-1.5 text-xs font-semibold text-[#8b2252]">✨ AI 牵线语</p>
                  <p className="text-sm leading-relaxed text-[#2d1b14]">{card.aiInsight}</p>
                </div>
              )}

              {/* Rating */}
              {card.myScore ? (
                <p className="text-center text-sm text-muted-foreground">
                  你的评分：{EMOJIS[card.myScore]} {LABELS[card.myScore]}
                </p>
              ) : (
                <div>
                  <p className="mb-2 text-center text-sm text-muted-foreground">对这位匹配对象的第一印象？</p>
                  <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onClick={() => submit(card.matchId, s)}
                        disabled={submitting === card.matchId}
                        className="flex flex-col items-center gap-0.5 rounded-xl p-2 text-2xl transition-transform hover:scale-110 active:scale-95 disabled:opacity-40"
                        title={LABELS[s]}
                      >
                        {EMOJIS[s]}
                        <span className="text-[10px] text-muted-foreground">{LABELS[s]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        <p className="pb-6 text-center text-xs text-muted-foreground">
          你的评分完全保密。双方都打 4 星及以上时，系统会互相揭示联系方式 ✨
        </p>
      </main>
    </div>
  );
}

export default function BlindDatePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-dvh items-center justify-center bg-[#fdf6f0]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#8b2252] border-t-transparent" />
      </div>
    }>
      <BlindDateCards />
    </Suspense>
  );
}
