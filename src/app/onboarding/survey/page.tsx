"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { surveySections } from "@/lib/survey-questions";
import { SliderInput } from "@/components/survey/slider-input";
import { SingleSelect } from "@/components/survey/single-select";
import { TagSelector } from "@/components/survey/tag-selector";
import { RankingSelector } from "@/components/survey/ranking-selector";
import { TextInput } from "@/components/survey/text-input";
import { cn } from "@/lib/utils";

type Answers = Record<string, number | string | string[]>;

export default function SurveyPage() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const mutation = trpc.survey.save.useMutation({
    onSuccess: () => router.push("/dashboard"),
  });

  const section = surveySections[currentSection];
  const totalSections = surveySections.length;
  const progress = ((currentSection + 1) / totalSections) * 100;

  const updateAnswer = useCallback(
    (questionId: string, value: number | string | string[]) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
    },
    []
  );

  function handleNext() {
    if (currentSection < totalSections - 1) {
      setCurrentSection((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      mutation.mutate({
        answers,
        completed: true,
      });
    }
  }

  function handleBack() {
    if (currentSection > 0) {
      setCurrentSection((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const isLastSection = currentSection === totalSections - 1;

  return (
    <div className="animate-fade-in">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>
            第 {currentSection + 1} / {totalSections} 部分
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
        {surveySections.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setCurrentSection(i)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
              i === currentSection
                ? "bg-primary text-primary-foreground"
                : i < currentSection
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Section header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-serif mb-2">{section.title}</h1>
        <p className="text-muted-foreground text-sm sm:text-base">{section.description}</p>
      </div>

      {/* Questions */}
      <div className="space-y-2 divide-y divide-border">
        {section.questions.map((q) => {
          if (q.type === "slider") {
            return (
              <SliderInput
                key={q.id}
                question={q.question}
                note={q.note}
                min={q.min}
                max={q.max}
                step={q.step}
                minLabel={q.minLabel}
                maxLabel={q.maxLabel}
                unit={q.unit}
                value={(answers[q.id] as number) ?? null}
                onChange={(v) => updateAnswer(q.id, v)}
              />
            );
          }
          if (q.type === "single") {
            return (
              <SingleSelect
                key={q.id}
                question={q.question}
                note={q.note}
                options={q.options}
                value={(answers[q.id] as string) ?? null}
                onChange={(v) => updateAnswer(q.id, v)}
              />
            );
          }
          if (q.type === "tags") {
            return (
              <TagSelector
                key={q.id}
                question={q.question}
                note={q.note}
                options={q.options}
                maxSelect={q.maxSelect}
                selected={(answers[q.id] as string[]) ?? []}
                onChange={(v) => updateAnswer(q.id, v)}
              />
            );
          }
          if (q.type === "ranking") {
            return (
              <RankingSelector
                key={q.id}
                question={q.question}
                note={q.note}
                options={q.options}
                selectCount={q.selectCount}
                selected={(answers[q.id] as string[]) ?? []}
                onChange={(v) => updateAnswer(q.id, v)}
              />
            );
          }
          if (q.type === "open_text") {
            return (
              <TextInput
                key={q.id}
                question={q.question}
                note={q.note}
                placeholder={q.placeholder}
                multiline={q.multiline}
                value={(answers[q.id] as string) ?? ""}
                onChange={(v) => updateAnswer(q.id, v)}
              />
            );
          }
          return null;
        })}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-10">
        {currentSection > 0 && (
          <button
            onClick={handleBack}
            className="flex-1 py-3 rounded-full border border-border text-foreground font-medium hover:bg-muted transition-colors"
          >
            上一部分
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={mutation.isPending}
          className="flex-1 py-3 rounded-full bg-primary text-primary-foreground font-medium text-lg hover:bg-accent transition-colors disabled:opacity-50"
        >
          {mutation.isPending
            ? "保存中..."
            : isLastSection
              ? "提交问卷"
              : "下一部分"}
        </button>
      </div>

      {mutation.error && (
        <p className="text-destructive text-sm mt-4 text-center">
          提交失败，请重试。
        </p>
      )}
    </div>
  );
}
