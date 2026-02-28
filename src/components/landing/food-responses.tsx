"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface FoodResponsesProps {
  responses: string[];
}

// CP 投票数据结构
interface CpVote {
  key: string;    // "idx1-idx2" 排序后的 key
  label1: string; // 第一条回答摘要
  label2: string; // 第二条回答摘要
  count: number;
}

const CP_STORAGE_KEY = "food-cp-votes";

function getCpKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function truncate(text: string, len = 12): string {
  // 取——前的食物名，没有则截断
  const m = text.match(/^(.{1,12})[——\-\–\—:：]/);
  if (m) return m[1].trim();
  return text.length > len ? text.slice(0, len) + "…" : text;
}

function loadVotes(): CpVote[] {
  try {
    const raw = localStorage.getItem(CP_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CpVote[]) : [];
  } catch {
    return [];
  }
}

function saveVotes(votes: CpVote[]) {
  try {
    localStorage.setItem(CP_STORAGE_KEY, JSON.stringify(votes));
  } catch { /* ignore */ }
}

export function FoodResponses({ responses }: FoodResponsesProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [showXi, setShowXi] = useState(false);
  const [blessing, setBlessing] = useState("");
  const [votes, setVotes] = useState<CpVote[]>([]);
  const [married, setMarried] = useState(false);
  const prevCountRef = useRef(0);

  // 加载历史投票
  useEffect(() => {
    setVotes(loadVotes());
  }, []);

  const handleMarry = useCallback(() => {
    if (selected.length !== 2) return;
    const [a, b] = selected;
    const key = getCpKey(a, b);
    setVotes((prev) => {
      const existing = prev.find((v) => v.key === key);
      let next: CpVote[];
      if (existing) {
        next = prev.map((v) => v.key === key ? { ...v, count: v.count + 1 } : v);
      } else {
        next = [...prev, { key, label1: truncate(responses[a]), label2: truncate(responses[b]), count: 1 }];
      }
      saveVotes(next);
      return next;
    });
    setMarried(true);
    setTimeout(() => setMarried(false), 2000);
  }, [selected, responses]);

  useEffect(() => {
    if (selected.length === 2 && prevCountRef.current < 2) {
      setShowXi(true);
      const timer = setTimeout(() => setShowXi(false), 3000);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = selected.length;
  }, [selected]);

  function toggleSelect(index: number) {
    setSelected((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index);
      if (prev.length >= 2) return [prev[1], index];
      return [...prev, index];
    });
  }

  return (
    <section className="py-16 px-6 bg-background">
      <div className="max-w-3xl mx-auto mb-8 text-center">
        <h2 className="text-3xl md:text-4xl font-serif mb-3">
          如果关系是一种食物
        </h2>
        <p className="text-muted-foreground text-base md:text-lg">
          {responses.length > 0
            ? `看看大家怎么说——来自 ${responses.length} 位测试者的真实回答`
            : "看看大家怎么说"}
        </p>
        {selected.length === 2 && (
          <p className="mt-2 text-sm text-primary font-medium">
            已选择 2 条回答
          </p>
        )}
        {selected.length < 2 && responses.length > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            点击选择两条你最喜欢的回答
          </p>
        )}
      </div>

      {/* CP 排行榜 */}
      {votes.length > 0 && (() => {
        const sorted = [...votes].sort((a, b) => b.count - a.count);
        const top3 = sorted.slice(0, 3);
        const rest = sorted.slice(3);
        const medals = ["🥇", "🥈", "🥉"];
        return (
        <div className="max-w-3xl mx-auto mb-8 animate-in fade-in duration-500">
          <h3 className="text-xl md:text-2xl font-serif text-center mb-6">
            🏆 CP 排行榜
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {top3.map((cp, rank) => (
                  <div
                    key={cp.key}
                    className={`rounded-xl border p-4 text-center transition-all ${
                      rank === 0
                        ? "border-yellow-400/50 bg-yellow-50/50 dark:bg-yellow-950/20"
                        : "border-border/50 bg-card"
                    }`}
                  >
                    <div className="text-2xl mb-2">{medals[rank]}</div>
                    <div className="text-sm font-medium text-foreground mb-1">
                      {cp.label1}
                    </div>
                    <div className="text-xs text-red-500 font-bold mb-1">❤️</div>
                    <div className="text-sm font-medium text-foreground mb-2">
                      {cp.label2}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {cp.count} 票
                    </div>
                  </div>
            ))}
          </div>

          {/* 三名开外的 CP */}
          {rest.length > 0 && (
            <ul className="mt-4 divide-y divide-border/50 rounded-xl border border-border/50 bg-card overflow-y-auto max-h-[7.5rem]">
              {rest.map((cp, i) => (
                <li key={cp.key} className="px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-foreground/80">
                    <span className="text-xs text-muted-foreground w-6 text-right">{i + 4}.</span>
                    <span>{cp.label1}</span>
                    <span className="text-red-400 text-xs">❤️</span>
                    <span>{cp.label2}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{cp.count} 票</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        );
      })()}

      <div className="max-w-3xl mx-auto">
        <p className="text-center text-muted-foreground text-sm mb-4">
          查看大家用食物形容的爱情，找出默契的 CP 吧 💕
        </p>
        {responses.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            还没有回答，快来成为第一个吧 ✨
          </div>
        ) : (
          <div className="relative">
          <ul className="divide-y divide-border/50 rounded-xl border border-border/50 bg-card overflow-y-auto max-h-[400px]">
            {responses.map((text, i) => {
              const isSelected = selected.includes(i);
              return (
                <li
                  key={i}
                  onClick={() => toggleSelect(i)}
                  className={`px-4 py-3 cursor-pointer transition-colors duration-150 select-none ${
                    isSelected
                      ? "bg-primary/10 border-l-2 border-l-primary"
                      : "hover:bg-muted/50 border-l-2 border-l-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 mt-0.5 text-xs text-muted-foreground w-6 text-right">
                      {i + 1}.
                    </span>
                    <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
                      {text}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* 囍字浮现淡出 */}
          {showXi && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <span
                className="text-red-500 font-serif font-bold drop-shadow-lg"
                style={{
                  fontSize: "clamp(6rem, 20vw, 12rem)",
                  animation: "xi-fade 3s ease-in-out forwards",
                }}
              >
                囍
              </span>
            </div>
          )}
          </div>
        )}

        {/* 选中卡片展示区 */}
        {selected.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {selected.map((idx) => (
              <div
                key={idx}
                className="rounded-xl border border-primary/30 bg-primary/5 p-5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-primary">
                    #{idx + 1}
                  </span>
                  <button
                    onClick={() => setSelected((prev) => prev.filter((i) => i !== idx))}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    取消选择
                  </button>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {responses[idx]}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* 两张卡片都选中时弹出输入框和结婚按钮 */}
        {selected.length === 2 && (
          <>
            <div className="mt-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <textarea
                value={blessing}
                onChange={(e) => setBlessing(e.target.value)}
                placeholder="写下你对这对 CP 的祝福吧..."
                rows={2}
                className="w-full rounded-xl border border-border/50 bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
            <div className="mt-4 flex justify-center animate-in fade-in zoom-in-95 duration-300">
              <button
                onClick={handleMarry}
                disabled={married}
                className={`px-8 py-3 rounded-full text-white font-bold text-lg shadow-lg shadow-red-500/30 transition-all duration-200 ${
                  married
                    ? "bg-red-400 cursor-default scale-95"
                    : "bg-red-500 hover:bg-red-600 active:scale-95"
                }`}
              >
                {married ? "🎉 已送出祝福！" : "💍 结婚！"}
              </button>
            </div>
          </>
        )}
      </div>

    </section>
  );
}
