"use client";

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { surveySections } from "@/lib/survey-questions";
import { SliderInput } from "@/components/survey/slider-input";
import { SingleSelect } from "@/components/survey/single-select";
import { TagSelector } from "@/components/survey/tag-selector";
import { RankingSelector } from "@/components/survey/ranking-selector";
import { TextInput } from "@/components/survey/text-input";
import { cn } from "@/lib/utils";

type Answers = Record<string, number | string | string[]>;

const TOTAL_STEPS = surveySections.length + 1; // +1 for email step

export default function SurveyPage() {
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const mutation = trpc.survey.submitPublic.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  const isEmailStep = currentSection >= surveySections.length;
  const progress = ((currentSection + 1) / TOTAL_STEPS) * 100;

  const updateAnswer = useCallback(
    (questionId: string, value: number | string | string[]) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
    },
    []
  );

  function handleNext() {
    if (currentSection < surveySections.length) {
      setCurrentSection((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleBack() {
    if (currentSection > 0) {
      setCurrentSection((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleSubmit() {
    if (!email || !displayName) return;
    mutation.mutate({
      email,
      displayName,
      answers,
    });
  }

  if (submitted) {
    return (
      <div className="animate-fade-in text-center py-16">
        <div className="text-5xl mb-6">🎉</div>
        <h1 className="text-3xl font-serif mb-4 text-primary">提交成功！</h1>
        <p className="text-muted-foreground text-lg mb-2">
          感谢你完成《关系基因匹配测试》
        </p>
        <p className="text-muted-foreground mb-8">
          匹配结果将发送至 <span className="font-medium text-foreground">{email}</span>
        </p>
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm max-w-md mx-auto text-left">
          <h3 className="font-serif text-lg mb-3">接下来会发生什么？</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="text-primary">1.</span> 我们会在每周匹配轮次中为你寻找最契合的对象</li>
            <li className="flex gap-2"><span className="text-primary">2.</span> 匹配成功后，你会收到邮件通知</li>
            <li className="flex gap-2"><span className="text-primary">3.</span> 邮件中会包含对方的联系方式和匹配原因</li>
          </ul>
        </div>
      </div>
    );
  }

  if (isEmailStep) {
    return (
      <div className="animate-fade-in">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>最后一步</span>
            <span>99%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: "99%" }}
            />
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif mb-3">差最后一步！</h1>
          <p className="text-muted-foreground">
            留下你的邮箱和昵称，我们会把匹配结果发送给你。
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium mb-2">
              你的昵称
            </label>
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
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              邮箱地址
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
            />
            <p className="text-xs text-muted-foreground mt-2">
              匹配结果将发送到此邮箱，请确保填写正确
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-10">
          <button
            onClick={handleBack}
            className="flex-1 py-3 rounded-full border border-border text-foreground font-medium hover:bg-muted transition-colors"
          >
            上一部分
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending || !email || !displayName}
            className="flex-1 py-3 rounded-full bg-primary text-primary-foreground font-medium text-lg hover:bg-accent transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? "提交中..." : "提交问卷"}
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

  const section = surveySections[currentSection];
  const isLastSurveySection = currentSection === surveySections.length - 1;

  return (
    <div className="animate-fade-in">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>
            第 {currentSection + 1} / {surveySections.length} 部分
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
          className="flex-1 py-3 rounded-full bg-primary text-primary-foreground font-medium text-lg hover:bg-accent transition-colors"
        >
          {isLastSurveySection ? "下一步：留下联系方式" : "下一部分"}
        </button>
      </div>
    </div>
  );
}
