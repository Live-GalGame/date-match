"use client";

import type { SurveyQuestion, SurveySection } from "@/lib/survey-versions/types";
import { SliderInput } from "./slider-input";
import { SingleSelect } from "./single-select";
import { TagSelector } from "./tag-selector";
import { RankingSelector } from "./ranking-selector";
import { TextInput } from "./text-input";
import { cn } from "@/lib/utils";
import type { Answers } from "./survey-types";

interface DeepSurveyFlowProps {
  sections: SurveySection[];
  currentIndex: number;
  setCurrentIndex: (v: number | ((prev: number) => number)) => void;
  answers: Answers;
  updateAnswer: (questionId: string, value: number | string | string[]) => void;
  progress: number;
  onNext: () => void;
  onBack: () => void;
}

export function DeepSurveyFlow({
  sections,
  currentIndex,
  setCurrentIndex,
  answers,
  updateAnswer,
  progress,
  onNext,
  onBack,
}: DeepSurveyFlowProps) {
  const section = sections[currentIndex];
  const isLastSection = currentIndex === sections.length - 1;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>第 {currentIndex + 1} / {sections.length} 部分</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
        {sections.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setCurrentIndex(i)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
              i === currentIndex
                ? "bg-primary text-primary-foreground"
                : i < currentIndex
                  ? "bg-primary/10 text-primary/80 dark:bg-primary/15 dark:text-primary/70"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {s.title}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-serif mb-2">{section.title}</h1>
        <p className="text-muted-foreground text-sm sm:text-base">{section.description}</p>
      </div>

      <div className="space-y-2 divide-y divide-border">
        {section.questions.map((q: SurveyQuestion) => {
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

      <div className="flex gap-3 mt-10">
        {currentIndex > 0 && (
          <button type="button" onClick={onBack} className="flex-1 py-3 rounded-full border border-border text-foreground font-medium hover:bg-muted transition-colors">
            上一部分
          </button>
        )}
        <button type="button" onClick={onNext} className="flex-1 py-3 rounded-full bg-primary text-primary-foreground font-medium text-lg hover:bg-accent transition-colors">
          {isLastSection ? "下一步：留下联系方式" : "下一部分"}
        </button>
      </div>
    </div>
  );
}
