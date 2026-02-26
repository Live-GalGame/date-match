"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  type Gender,
  type OtherGenderOption,
  type DatingPref,
  GENDER_OPTIONS,
  OTHER_GENDER_OPTIONS,
  DATING_OPTIONS,
  HELICOPTER_QUESTIONS,
  HELICOPTER_PHOTOS,
} from "./survey-types";

interface GenderStepProps {
  gender: Gender;
  setGender: (v: Gender) => void;
  otherGender: OtherGenderOption;
  setOtherGender: (v: OtherGenderOption) => void;
  datingPreference: DatingPref;
  setDatingPreference: (v: DatingPref) => void;
  displayName: string;
  setDisplayName: (v: string) => void;
  onComplete: () => void;
}

export function GenderStep({
  gender, setGender,
  otherGender, setOtherGender,
  datingPreference, setDatingPreference,
  displayName, setDisplayName,
  onComplete,
}: GenderStepProps) {
  const [heliPhase, setHeliPhase] = useState<null | "quiz" | "loading" | "result">(null);
  const [heliStep, setHeliStep] = useState(0);
  const [heliAnswers, setHeliAnswers] = useState<Record<string, string>>({});
  const [showHeliSplash, setShowHeliSplash] = useState(false);
  const heliSplashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (showHeliSplash) {
      const audio = new Audio("/SeeUAgain.mp3");
      audio.volume = 0.35;
      audio.play().catch(() => {});
      audioRef.current = audio;
    }
  }, [showHeliSplash]);

  const helicopterQuery = trpc.survey.getHelicopterPilots.useQuery(undefined, {
    enabled: heliPhase === "result",
  });
  const registerHeliMutation = trpc.survey.registerHelicopterPilot.useMutation();

  const floatingHelicopters = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        left: `${(i * 37) % 95}%`,
        duration: `${4 + ((i * 17) % 50) / 10}s`,
        delay: `${((i * 13) % 30) / 10}s`,
        size: `${1.5 + ((i * 19) % 20) / 10}rem`,
      })),
    []
  );

  // ─── Helicopter Quiz ───
  if (heliPhase === "quiz") {
    const hq = HELICOPTER_QUESTIONS[heliStep];
    return (
      <div key={`heli-${heliStep}`} className="animate-fade-in">
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>武装直升机专属测试 {heliStep + 1} / 3</span>
            <span>🚁</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((heliStep + 1) / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-serif mb-1">{hq.question}</h1>
          <p className="text-sm text-muted-foreground">{hq.subtitle}</p>
        </div>

        <div className="space-y-3">
          {hq.options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setHeliAnswers((prev) => ({ ...prev, [hq.id]: opt.value }));
                setTimeout(() => {
                  if (heliStep < 2) {
                    setHeliStep((s) => s + 1);
                  } else {
                    setHeliPhase("loading");
                    setTimeout(() => {
                      setHeliPhase("result");
                      setShowHeliSplash(true);
                      if (heliSplashTimer.current) clearTimeout(heliSplashTimer.current);
                      heliSplashTimer.current = setTimeout(() => setShowHeliSplash(false), 3000);
                    }, 3000);
                  }
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }, 300);
              }}
              className={cn(
                "w-full flex items-start gap-4 px-5 py-4 rounded-xl border-2 text-left transition-all",
                heliAnswers[hq.id] === opt.value
                  ? "border-primary bg-primary/10 text-primary scale-[1.01] shadow-md"
                  : "border-border bg-card text-foreground hover:border-primary/40 hover:shadow-sm"
              )}
            >
              <span className="text-3xl shrink-0 mt-0.5">{opt.emoji}</span>
              <span className="text-sm leading-relaxed">{opt.label}</span>
            </button>
          ))}
        </div>

        {heliStep > 0 && (
          <div className="mt-6">
            <button type="button" onClick={() => setHeliStep((s) => s - 1)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← 上一题
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── Helicopter Loading ───
  if (heliPhase === "loading") {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24">
        <div className="text-6xl mb-8 animate-heart-pulse">💗</div>
        <h2 className="text-xl sm:text-2xl font-serif font-bold mb-6 text-center">匹配中...</h2>
        <div className="w-full max-w-xs h-3 bg-muted rounded-full overflow-hidden mb-4">
          <div className="h-full bg-primary rounded-full transition-none" style={{ animation: "heli-progress 3s linear forwards" }} />
        </div>
      </div>
    );
  }

  // ─── Helicopter Result ───
  if (heliPhase === "result") {
    const pilotNames = helicopterQuery.data?.names ?? [];
    const pilotCount = helicopterQuery.data?.count ?? 0;
    const allPilots = displayName.trim() ? [displayName.trim(), ...pilotNames] : pilotNames;
    const totalCount = displayName.trim() ? pilotCount + 1 : pilotCount;

    return (
      <>
        {showHeliSplash && createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-xl animate-splash-overlay cursor-pointer"
            onClick={() => { setShowHeliSplash(false); if (heliSplashTimer.current) clearTimeout(heliSplashTimer.current); }}
          >
            <div className="flex items-center gap-6">
              <span className="text-[10rem] sm:text-[14rem] leading-none animate-splash-icon animate-heart-pulse">❤️</span>
              <span className="text-[10rem] sm:text-[14rem] leading-none animate-splash-icon" style={{ animationDelay: "0.3s" }}>🚁</span>
            </div>
          </div>,
          document.body
        )}

      <div className="animate-fade-in">
        <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
          {floatingHelicopters.map((h) => (
            <div
              key={h.id}
              className="absolute animate-helicopter-float"
              style={{ left: h.left, fontSize: h.size, ["--float-duration" as string]: h.duration, ["--float-delay" as string]: h.delay }}
            >
              🚁
            </div>
          ))}
        </div>

        <div className="relative z-50">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4 animate-helicopter-shake">🚁</div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold mb-2">测试完成！这是你的心动对象</h1>
            <p className="text-muted-foreground">根据你的战术偏好，我们为你匹配了以下武装直升机</p>
          </div>

          <div className="grid gap-4 mb-8">
            {HELICOPTER_PHOTOS.slice(0, 1).map((src, i) => (
              <div key={src} className="relative rounded-2xl overflow-hidden border-2 border-border shadow-lg">
                <Image src={src} alt={`心动武装直升机 ${i + 1}`} width={700} height={400} className="w-full h-auto object-cover" priority />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
                  <p className="text-white font-medium text-sm">心动对象 #{i + 1}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 mb-4 shadow-sm">
            <label htmlFor="heliNickname" className="block text-lg font-serif font-bold text-center mb-1">请留下你的昵称，飞行员！</label>
            <p className="text-xs text-muted-foreground text-center mb-4">你的代号将加入武装直升机编队</p>
            <input
              id="heliNickname"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="输入你的飞行代号..."
              className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-foreground text-center placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
            />
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 mb-8 shadow-sm">
            <p className="text-lg text-primary font-medium text-center mb-4">
              当前共有 <span className="text-2xl font-bold">{totalCount}</span> 位武装直升机飞行员！
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {allPilots.map((name, i) => (
                <span key={i} className={cn("px-3 py-1.5 rounded-full text-sm font-medium transition-all", i === 0 && displayName.trim() ? "bg-primary text-primary-foreground shadow-md scale-105" : "bg-primary/10 text-primary")}>
                  🚁 {name}
                </span>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (displayName.trim()) registerHeliMutation.mutate({ displayName: displayName.trim() });
              setHeliPhase(null);
            }}
            className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium text-lg hover:bg-accent transition-colors"
          >
            太酷了！继续填写 →
          </button>
        </div>
      </div>
      </>
    );
  }

  // ─── Main Gender Selection ───
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-serif mb-3">先认识一下你</h1>
        <p className="text-muted-foreground">这些信息会帮我们为你找到更合适的人</p>
      </div>

      <div className="space-y-8">
        <div>
          <label className="block text-sm font-medium mb-3">你的性别</label>
          <div className="grid grid-cols-3 gap-3">
            {GENDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { setGender(opt.value); if (opt.value !== "其他") { setOtherGender(""); setHeliPhase(null); } }}
                className={cn(
                  "flex flex-col items-center gap-2 px-3 py-4 rounded-xl border-2 text-sm font-medium transition-all",
                  gender === opt.value ? "border-primary bg-primary/10 text-primary scale-[1.02] shadow-md" : "border-border bg-card text-foreground hover:border-primary/40 hover:shadow-sm"
                )}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
          {gender === "其他" && (
            <div className="mt-3">
              <label className="block text-sm font-medium mb-2 text-muted-foreground">请选择具体选项</label>
              <select
                value={otherGender}
                onChange={(e) => {
                  const value = e.target.value as OtherGenderOption;
                  setOtherGender(value);
                  if (value === "武装直升机") { setHeliPhase("quiz"); setHeliStep(0); setHeliAnswers({}); } else { setHeliPhase(null); }
                }}
                className="w-full rounded-xl border-2 border-border bg-card px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
              >
                <option value="" disabled>请选择</option>
                {OTHER_GENDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-3">你想 date 的性别</label>
          <div className="grid grid-cols-3 gap-3">
            {DATING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDatingPreference(opt.value)}
                className={cn(
                  "flex flex-col items-center gap-2 px-3 py-4 rounded-xl border-2 text-sm font-medium transition-all",
                  datingPreference === opt.value ? "border-primary bg-primary/10 text-primary scale-[1.02] shadow-md" : "border-border bg-card text-foreground hover:border-primary/40 hover:shadow-sm"
                )}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
          {datingPreference === "不愿意透露" && (
            <p className="text-sm text-amber-600 dark:text-amber-500 mt-3 flex items-start gap-1.5 animate-in fade-in zoom-in-95 duration-200">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>我们尊重您的选择，但请注意，"不愿意透露"会极大地降低匹配概率。</span>
            </p>
          )}
        </div>
      </div>

      <div className="mt-10">
        <button
          type="button"
          disabled={!gender || (gender === "其他" && !otherGender) || !datingPreference}
          onClick={onComplete}
          className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium text-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          继续 →
        </button>
      </div>
    </div>
  );
}
