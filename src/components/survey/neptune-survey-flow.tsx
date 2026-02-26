"use client";

import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { getSurveyVersion } from "@/lib/survey-questions";
import type {
  SurveyQuestion,
  SingleQuestion,
  SliderQuestion,
  RankingQuestion,
  TagsQuestion,
} from "@/lib/survey-versions/types";
import { EmojiCardSelect } from "./emoji-card-select";
import { SingleSelect } from "./single-select";
import { SliderInput } from "./slider-input";
import { RankingSelector } from "./ranking-selector";
import { TagSelector } from "./tag-selector";
import type { Answers } from "./survey-types";

const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
] as const;

const ZODIAC_SIGNS = [
  { value: "白羊座", emoji: "♈" },
  { value: "金牛座", emoji: "♉" },
  { value: "双子座", emoji: "♊" },
  { value: "巨蟹座", emoji: "♋" },
  { value: "狮子座", emoji: "♌" },
  { value: "处女座", emoji: "♍" },
  { value: "天秤座", emoji: "♎" },
  { value: "天蝎座", emoji: "♏" },
  { value: "射手座", emoji: "♐" },
  { value: "摩羯座", emoji: "♑" },
  { value: "水瓶座", emoji: "♒" },
  { value: "双鱼座", emoji: "♓" },
] as const;

interface NeptuneSurveyFlowProps {
  displayName: string;
  onBack: () => void;
}

type Phase = "intro" | "quiz" | "info" | "submitted";

export function NeptuneSurveyFlow({ displayName, onBack }: NeptuneSurveyFlowProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [mbti, setMbti] = useState("");
  const [zodiac, setZodiac] = useState("");
  const [neptuneName, setNeptuneName] = useState(displayName);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const version = getSurveyVersion("neptune")!;
  const allQuestions = version.sections.flatMap((s) => s.questions);

  const mutation = trpc.neptune.submit.useMutation({
    onSuccess: () => setPhase("submitted"),
  });

  const handleSingleAnswer = useCallback(
    (questionId: string, value: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(() => {
        setCurrentIndex((prev) => {
          if (prev < allQuestions.length - 1) {
            window.scrollTo({ top: 0, behavior: "smooth" });
            return prev + 1;
          }
          setPhase("info");
          window.scrollTo({ top: 0, behavior: "smooth" });
          return prev;
        });
      }, 400);
    },
    [allQuestions.length],
  );

  function handleAnswer(questionId: string, value: number | string | string[]) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleNext() {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (currentIndex < allQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setPhase("info");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleQuizBack() {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleSubmit() {
    if (!neptuneName || !mbti || !zodiac) return;
    mutation.mutate({
      displayName: neptuneName,
      mbti,
      zodiac,
      answers,
    });
  }

  if (phase === "intro") {
    return (
      <div className="animate-fade-in text-center space-y-8 py-8">
        <div className="text-6xl">🔱</div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif mb-3">海王星挑战</h1>
          <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
            你有多了解当代人的恋爱心理？
          </p>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl p-6 max-w-md mx-auto text-left space-y-3">
          <p className="text-sm leading-relaxed">
            下面有 <strong>9 道</strong>来自我们真实问卷的题目，但这次——
          </p>
          <p className="text-base font-serif text-indigo-700 dark:text-indigo-300">
            你要猜的不是自己的答案，而是大多数人会怎么选。
          </p>
          <p className="text-xs text-muted-foreground">
            完成后提交你的 MBTI 和星座，每周公布最具「海王潜质」的排行榜。
          </p>
        </div>

        <div className="space-y-3 max-w-xs mx-auto">
          <button
            type="button"
            onClick={() => setPhase("quiz")}
            className="w-full py-3.5 rounded-full bg-indigo-600 text-white font-medium text-lg hover:bg-indigo-700 transition-colors"
          >
            开始挑战
          </button>
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            返回版本选择
          </button>
        </div>
      </div>
    );
  }

  if (phase === "submitted") {
    return (
      <div className="animate-fade-in text-center space-y-8 py-8">
        <div className="text-6xl">🎉</div>
        <div>
          <h1 className="text-3xl font-serif mb-3">已提交!</h1>
          <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
            你的海王星挑战答案已收录。每周公布排行榜，敬请关注!
          </p>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl p-5 max-w-xs mx-auto">
          <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium mb-1">
            {neptuneName}
          </p>
          <p className="text-xs text-muted-foreground">
            {mbti} · {zodiac}
          </p>
        </div>

        <div className="space-y-3 max-w-xs mx-auto">
          <button
            type="button"
            onClick={onBack}
            className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-accent transition-colors"
          >
            去做真正的匹配测试
          </button>
        </div>
      </div>
    );
  }

  if (phase === "info") {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-2">🔱</div>
          <h2 className="text-2xl font-serif mb-1">提交你的答案</h2>
          <p className="text-sm text-muted-foreground">
            填写信息，看看你有多了解当代人的恋爱心理
          </p>
        </div>

        <div className="space-y-5 max-w-md mx-auto">
          <div>
            <label className="block text-sm font-medium mb-2">你的昵称</label>
            <input
              type="text"
              value={neptuneName}
              onChange={(e) => setNeptuneName(e.target.value)}
              placeholder="海王本王"
              maxLength={50}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">你的 MBTI</label>
            <div className="grid grid-cols-4 gap-2">
              {MBTI_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMbti(type)}
                  className={`px-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    mbti === type
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-muted text-muted-foreground hover:bg-border"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">你的星座</label>
            <div className="grid grid-cols-4 gap-2">
              {ZODIAC_SIGNS.map((sign) => (
                <button
                  key={sign.value}
                  type="button"
                  onClick={() => setZodiac(sign.value)}
                  className={`flex flex-col items-center gap-0.5 px-2 py-2.5 rounded-xl text-sm transition-all ${
                    zodiac === sign.value
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-muted text-muted-foreground hover:bg-border"
                  }`}
                >
                  <span className="text-base">{sign.emoji}</span>
                  <span className="text-xs">{sign.value}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between max-w-md mx-auto pt-2">
          <button
            type="button"
            onClick={() => {
              setPhase("quiz");
              setCurrentIndex(allQuestions.length - 1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← 返回修改
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!neptuneName || !mbti || !zodiac || mutation.isPending}
            className="px-8 py-3 rounded-full bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? "提交中..." : "提交挑战"}
          </button>
        </div>

        {mutation.error && (
          <p className="text-center text-sm text-destructive">提交失败，请重试</p>
        )}
      </div>
    );
  }

  // phase === "quiz"
  const q = allQuestions[currentIndex];
  const progress = ((currentIndex + 1) / allQuestions.length) * 100;
  const currentAnswer = answers[q.id];
  const hasAnswer =
    currentAnswer !== undefined &&
    currentAnswer !== "" &&
    (!Array.isArray(currentAnswer) || currentAnswer.length > 0);

  return (
    <div key={currentIndex} className="animate-fade-in">
      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span className="flex items-center gap-1.5">
            <span>🔱</span>
            {currentIndex + 1} / {allQuestions.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mb-3 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
        <p className="text-xs text-indigo-600 dark:text-indigo-400 text-center">
          你觉得大多数人会怎么选？
        </p>
      </div>

      <QuestionRenderer
        question={q}
        answers={answers}
        onSingleAnswer={handleSingleAnswer}
        onAnswer={handleAnswer}
      />

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handleQuizBack}
          className={`text-sm text-muted-foreground hover:text-foreground transition-colors ${
            currentIndex === 0 ? "invisible" : ""
          }`}
        >
          ← 上一题
        </button>

        {q.type !== "single" && (
          <button
            type="button"
            onClick={handleNext}
            disabled={!hasAnswer}
            className="px-6 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {currentIndex === allQuestions.length - 1 ? "完成" : "下一题 →"}
          </button>
        )}
      </div>
    </div>
  );
}

function QuestionRenderer({
  question,
  answers,
  onSingleAnswer,
  onAnswer,
}: {
  question: SurveyQuestion;
  answers: Answers;
  onSingleAnswer: (id: string, value: string) => void;
  onAnswer: (id: string, value: number | string | string[]) => void;
}) {
  const q = question;

  if (q.type === "single") {
    const sq = q as SingleQuestion;
    const hasImages = sq.options.some((o) => o.image);

    if (hasImages) {
      return (
        <EmojiCardSelect
          question={sq.question}
          note={sq.note}
          options={sq.options}
          value={(answers[sq.id] as string) ?? null}
          onChange={(v) => onSingleAnswer(sq.id, v)}
        />
      );
    }

    return (
      <SingleSelect
        question={sq.question}
        note={sq.note}
        options={sq.options}
        value={(answers[sq.id] as string) ?? null}
        onChange={(v) => onSingleAnswer(sq.id, v)}
      />
    );
  }

  if (q.type === "slider") {
    const sl = q as SliderQuestion;
    return (
      <SliderInput
        question={sl.question}
        note={sl.note}
        min={sl.min}
        max={sl.max}
        step={sl.step}
        minLabel={sl.minLabel}
        maxLabel={sl.maxLabel}
        unit={sl.unit}
        value={(answers[sl.id] as number) ?? null}
        onChange={(v) => onAnswer(sl.id, v)}
      />
    );
  }

  if (q.type === "ranking") {
    const rq = q as RankingQuestion;
    return (
      <RankingSelector
        question={rq.question}
        note={rq.note}
        options={rq.options}
        selectCount={rq.selectCount}
        selected={(answers[rq.id] as string[]) ?? []}
        onChange={(v) => onAnswer(rq.id, v)}
      />
    );
  }

  if (q.type === "tags") {
    const tq = q as TagsQuestion;
    return (
      <TagSelector
        question={tq.question}
        note={tq.note}
        options={tq.options}
        maxSelect={tq.maxSelect}
        selected={(answers[tq.id] as string[]) ?? []}
        onChange={(v) => onAnswer(tq.id, v)}
      />
    );
  }

  return null;
}
