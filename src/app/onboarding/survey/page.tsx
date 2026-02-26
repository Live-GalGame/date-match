"use client";

import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { TurnstileInstance } from "@marsidev/react-turnstile";
import { trpc } from "@/lib/trpc";
import { getSurveyVersion } from "@/lib/survey-questions";
import type { SingleQuestion } from "@/lib/survey-versions/types";
import {
  type Answers,
  type VersionId,
  type Gender,
  type OtherGenderOption,
  type DatingPref,
  type PersistedSurveyState,
  loadPersistedSurveyState,
} from "@/components/survey/survey-types";
import { GenderStep } from "@/components/survey/gender-step";
import { VersionSelector } from "@/components/survey/version-selector";
import { DeepIntro } from "@/components/survey/deep-intro";
import { LiteSurveyFlow } from "@/components/survey/lite-survey-flow";
import { DeepSurveyFlow } from "@/components/survey/deep-survey-flow";
import { EmailStep } from "@/components/survey/email-step";
import { SubmittedState } from "@/components/survey/submitted-state";

export default function SurveyPage() {
  return (
    <Suspense>
      <SurveyPageInner />
    </Suspense>
  );
}

function SurveyPageInner() {
  const searchParams = useSearchParams();

  // Prevent hydration mismatch: server has no localStorage, so we defer
  // rendering real content until after the first client-side effect.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  const [referralCode] = useState<string>(() => {
    const fromUrl = typeof window !== "undefined" ? searchParams.get("code") ?? "" : "";
    if (fromUrl) {
      try { localStorage.setItem("referralCode", fromUrl); } catch {}
      return fromUrl;
    }
    try { return localStorage.getItem("referralCode") ?? ""; } catch { return ""; }
  });

  const [savedState] = useState<Partial<PersistedSurveyState>>(() => loadPersistedSurveyState());

  // ─── Core form state ───
  const [gender, setGender] = useState<Gender>(() => {
    const s: string = typeof savedState.gender === "string" ? savedState.gender : "";
    if (s === "男" || s === "女" || s === "其他") return s;
    if (s === "不愿意透露" || s === "武装直升机") return "其他";
    return "";
  });
  const [otherGender, setOtherGender] = useState<OtherGenderOption>(() => {
    const so: string = typeof savedState.otherGender === "string" ? savedState.otherGender : "";
    if (so === "不愿意透露" || so === "武装直升机") return so;
    const sg: string = typeof savedState.gender === "string" ? savedState.gender : "";
    if (sg === "不愿意透露" || sg === "武装直升机") return sg;
    return "";
  });
  const [datingPreference, setDatingPreference] = useState<DatingPref>((savedState.datingPreference as DatingPref) || "");
  const [genderDone, setGenderDone] = useState(Boolean(savedState.genderDone));

  const [selectedVersion, setSelectedVersion] = useState<VersionId | null>(
    savedState.selectedVersion === "v3-lite" || savedState.selectedVersion === "v2" ? savedState.selectedVersion : null
  );
  const [currentIndex, setCurrentIndex] = useState(typeof savedState.currentIndex === "number" ? savedState.currentIndex : 0);
  const [answers, setAnswers] = useState<Answers>(savedState.answers && typeof savedState.answers === "object" ? savedState.answers : {});
  const [liteAnswers, setLiteAnswers] = useState<Answers>(savedState.liteAnswers && typeof savedState.liteAnswers === "object" ? savedState.liteAnswers : {});
  const [email, setEmail] = useState(savedState.email || "");
  const [displayName, setDisplayName] = useState(savedState.displayName || "");
  const [education, setEducation] = useState(savedState.education || "");
  const [schoolTier, setSchoolTier] = useState(savedState.schoolTier || "");
  const [matchStrategy, setMatchStrategy] = useState(savedState.matchStrategy || "");

  // ─── UI state ───
  const [submitted, setSubmitted] = useState(false);
  const [emailSendIssue, setEmailSendIssue] = useState<string | null>(null);
  const [showDeepIntro, setShowDeepIntro] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const turnstileRef = useRef<TurnstileInstance>(null);

  const hasLiteData = Object.keys(liteAnswers).length > 0;

  // ─── Persist state ───
  useEffect(() => {
    if (submitted) { localStorage.removeItem("surveyState"); return; }
    try {
      localStorage.setItem("surveyState", JSON.stringify({
        answers, liteAnswers, selectedVersion, currentIndex,
        gender, otherGender, datingPreference, genderDone,
        email, displayName, education, schoolTier, matchStrategy,
      }));
    } catch (e) { console.error("Failed to save survey state:", e); }
  }, [answers, liteAnswers, selectedVersion, currentIndex, gender, otherGender, datingPreference, genderDone, email, displayName, education, schoolTier, matchStrategy, submitted]);

  // ─── Mutations ───
  const mutation = trpc.survey.submitPublic.useMutation({
    onSuccess: (result) => {
      setEmailSendIssue(result.emailSent ? null : "首次验证邮件发送失败，请点击下方按钮重新发送。");
      if (result.shareCode && typeof window !== "undefined") {
        try { localStorage.setItem("myShareCode", result.shareCode); } catch {}
      }
      setSubmitted(true);
      setTurnstileToken("");
    },
    onError: () => { turnstileRef.current?.reset(); setTurnstileToken(""); },
  });

  const resendMutation = trpc.survey.resendConfirmation.useMutation();
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResend = useCallback(() => {
    if (!email || resendMutation.isPending || resendCooldown > 0) return;
    resendMutation.reset();
    resendMutation.mutate({ email, turnstileToken: turnstileToken || undefined }, {
      onSettled: () => { setResendCooldown(5); turnstileRef.current?.reset(); setTurnstileToken(""); },
    });
  }, [email, resendMutation, resendCooldown, turnstileToken]);

  // ─── Derived survey data ───
  const version = selectedVersion ? getSurveyVersion(selectedVersion) : null;
  const sections = version?.sections ?? [];
  const allQuestions = sections.flatMap((s) => s.questions);
  const isLite = selectedVersion === "v3-lite";
  const totalSteps = isLite ? allQuestions.length + 1 : sections.length + 1;
  const isEmailStep = isLite ? currentIndex >= allQuestions.length : currentIndex >= sections.length;
  const progress = ((currentIndex + 1) / totalSteps) * 100;

  // ─── Handlers ───
  const updateAnswer = useCallback(
    (questionId: string, value: number | string | string[]) => { setAnswers((prev) => ({ ...prev, [questionId]: value })); },
    []
  );

  function handleNext() {
    if (!isEmailStep) { setCurrentIndex((prev) => prev + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
  }

  function handleBack() {
    if (currentIndex > 0) { setCurrentIndex((prev) => prev - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
  }

  function handleSubmit() {
    if (!email || !displayName || !education || !schoolTier || !matchStrategy) return;
    setEmailSendIssue(null);
    const mergedAnswers = { ...liteAnswers, ...answers, matchStrategy };
    const versionTag = hasLiteData ? "v3-lite+v2" : (selectedVersion ?? undefined);
    const submitGender = gender === "其他" ? otherGender : gender;
    mutation.mutate({
      email, displayName,
      gender: submitGender || undefined,
      datingPreference: datingPreference || undefined,
      education, schoolTier,
      answers: mergedAnswers,
      surveyVersion: versionTag,
      referralCode: referralCode || undefined,
      turnstileToken: turnstileToken || undefined,
      honeypot: honeypot || undefined,
    });
  }

  function handleTryDeep() {
    setLiteAnswers(answers);
    setSubmitted(false);
    setShowDeepIntro(true);
  }

  function startDeep() {
    setShowDeepIntro(false);
    setSelectedVersion("v2");
    setCurrentIndex(0);
    setAnswers({});
  }

  // ─── Phase routing ───

  // Wait for hydration so localStorage-derived state matches between server/client
  if (!hydrated) {
    return null;
  }

  if (!genderDone) {
    return (
      <GenderStep
        gender={gender} setGender={setGender}
        otherGender={otherGender} setOtherGender={setOtherGender}
        datingPreference={datingPreference} setDatingPreference={setDatingPreference}
        displayName={displayName} setDisplayName={setDisplayName}
        onComplete={() => setGenderDone(true)}
      />
    );
  }

  if (!selectedVersion) {
    return <VersionSelector onSelect={setSelectedVersion} />;
  }

  if (showDeepIntro) {
    return <DeepIntro onStart={startDeep} />;
  }

  if (submitted) {
    return (
      <SubmittedState
        isLite={isLite}
        hasLiteData={hasLiteData}
        email={email}
        displayName={displayName}
        emailSendIssue={emailSendIssue}
        answers={answers}
        liteAnswers={liteAnswers}
        selectedVersion={selectedVersion}
        turnstileRef={turnstileRef}
        turnstileToken={turnstileToken}
        setTurnstileToken={setTurnstileToken}
        handleResend={handleResend}
        resendState={{ isPending: resendMutation.isPending, isError: resendMutation.isError, isSuccess: resendMutation.isSuccess }}
        resendCooldown={resendCooldown}
        onTryDeep={isLite ? handleTryDeep : undefined}
      />
    );
  }

  if (isEmailStep) {
    return (
      <EmailStep
        hasLiteData={hasLiteData}
        displayName={displayName} setDisplayName={setDisplayName}
        education={education} setEducation={setEducation}
        schoolTier={schoolTier} setSchoolTier={setSchoolTier}
        matchStrategy={matchStrategy} setMatchStrategy={setMatchStrategy}
        email={email} setEmail={setEmail}
        honeypot={honeypot} setHoneypot={setHoneypot}
        turnstileRef={turnstileRef}
        setTurnstileToken={setTurnstileToken}
        onBack={handleBack}
        onSubmit={handleSubmit}
        isPending={mutation.isPending}
        error={!!mutation.error}
      />
    );
  }

  if (isLite) {
    return (
      <LiteSurveyFlow
        allQuestions={allQuestions as SingleQuestion[]}
        currentIndex={currentIndex}
        setCurrentIndex={setCurrentIndex}
        answers={answers}
        setAnswers={setAnswers}
        progress={progress}
      />
    );
  }

  return (
    <DeepSurveyFlow
      sections={sections}
      currentIndex={currentIndex}
      setCurrentIndex={setCurrentIndex}
      answers={answers}
      updateAnswer={updateAnswer}
      progress={progress}
      onNext={handleNext}
      onBack={handleBack}
    />
  );
}
