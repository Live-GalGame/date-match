"use client";

import { useRef, useCallback } from "react";
import type { SingleQuestion } from "@/lib/survey-versions/types";
import { EmojiCardSelect } from "./emoji-card-select";
import type { Answers } from "./survey-types";

interface LiteSurveyFlowProps {
  allQuestions: SingleQuestion[];
  currentIndex: number;
  setCurrentIndex: (fn: (prev: number) => number) => void;
  answers: Answers;
  setAnswers: (fn: (prev: Answers) => Answers) => void;
  progress: number;
}

export function LiteSurveyFlow({
  allQuestions,
  currentIndex,
  setCurrentIndex,
  answers,
  setAnswers,
  progress,
}: LiteSurveyFlowProps) {
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLiteAnswer = useCallback(
    (questionId: string, value: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 350);
    },
    [setAnswers, setCurrentIndex]
  );

  function handleBack() {
    if (currentIndex > 0) {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      setCurrentIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const q = allQuestions[currentIndex];
  return (
    <div key={currentIndex} className="animate-fade-in">
      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>{currentIndex + 1} / {allQuestions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <EmojiCardSelect
        question={q.question}
        note={q.note}
        options={q.options}
        value={(answers[q.id] as string) ?? null}
        onChange={(v) => handleLiteAnswer(q.id, v)}
      />

      {currentIndex > 0 && (
        <div className="mt-6">
          <button type="button" onClick={handleBack} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← 上一题
          </button>
        </div>
      )}
    </div>
  );
}
