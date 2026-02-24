"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { trpc } from "@/lib/trpc";
import { getSurveyVersion } from "@/lib/survey-questions";
import type { SurveyQuestion, SingleQuestion } from "@/lib/survey-versions/types";
import { SliderInput } from "@/components/survey/slider-input";
import { SingleSelect } from "@/components/survey/single-select";
import { TagSelector } from "@/components/survey/tag-selector";
import { RankingSelector } from "@/components/survey/ranking-selector";
import { TextInput } from "@/components/survey/text-input";
import { EmojiCardSelect } from "@/components/survey/emoji-card-select";
import { cn } from "@/lib/utils";

type Answers = Record<string, number | string | string[]>;
type VersionId = "v3-lite" | "v2";

type Gender = "" | "男" | "女" | "不愿意透露" | "武装直升机";
type DatingPref = "" | "男" | "女" | "不愿意透露";

interface PersistedSurveyState {
  answers: Answers;
  liteAnswers: Answers;
  selectedVersion: VersionId | null;
  currentIndex: number;
  gender: Gender;
  datingPreference: DatingPref;
  genderDone: boolean;
  email: string;
  displayName: string;
  education: string;
  schoolTier: string;
}

function loadPersistedSurveyState(): Partial<PersistedSurveyState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem("surveyState");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch (e) {
    console.error("Failed to load survey state:", e);
    return {};
  }
}

const GENDER_OPTIONS: { value: Gender; emoji: string; label: string }[] = [
  { value: "男", emoji: "👨", label: "男" },
  { value: "女", emoji: "👩", label: "女" },
  { value: "不愿意透露", emoji: "🤫", label: "不愿意透露" },
  { value: "武装直升机", emoji: "🚁", label: "武装直升机" },
];

const DATING_OPTIONS: { value: DatingPref; emoji: string; label: string }[] = [
  { value: "男", emoji: "👨", label: "男" },
  { value: "女", emoji: "👩", label: "女" },
  { value: "不愿意透露", emoji: "🤷", label: "不愿意透露" },
];

const HELICOPTER_QUESTIONS = [
  {
    id: "heli_hunt",
    question: "锁定目标（暗恋）时，你的日常机动是？",
    subtitle: "索敌/开火主动性",
    options: [
      { value: "A", emoji: "📡", label: "开启雷达超视距扫描，偷偷收集对方的红外特征。" },
      { value: "B", emoji: "✈️", label: "精心伪装成民航客机，在 TA 的日常航线上来回盘旋制造「偶遇」。" },
      { value: "C", emoji: "🎯", label: "火控系统锁定了又取消，取消了又锁定，不敢按下发射键。" },
      { value: "D", emoji: "🚀", label: "直接挂满地狱火导弹，低空通场硬核表白！" },
    ],
  },
  {
    id: "heli_comms",
    question: "接收到心上机（僚机）的无线电信号，你的第一反应？",
    subtitle: "通讯坦诚度 / 战术策略性",
    options: [
      { value: "A", emoji: "📻", label: "保持无线电静默 3 分钟——不能显得太上头，要有主战装备的矜持。" },
      { value: "B", emoji: "🔥", label: "旋翼转速拉满！最高优先权！秒回塔台！" },
      { value: "C", emoji: "🛰️", label: "截获频段发给指挥部，召唤预警机智囊团分析信号情报。" },
      { value: "D", emoji: "🕶️", label: "开启加密频段，精调发射功率，发送一段毫无破绽的摩斯密码。" },
    ],
  },
  {
    id: "heli_date",
    question: "第一次联合编队飞行（约会），你选？",
    subtitle: "巡航舒适区 / 任务风格",
    options: [
      { value: "A", emoji: "🍿", label: "去低空看防空火力网交织——不用找话题，还有超棒的视觉特效。" },
      { value: "B", emoji: "⛽", label: "一起去找空中加油机——边「吨吨吨」滋燃油边聊最放松。" },
      { value: "C", emoji: "🌅", label: "沿海岸线超低空巡逻，边飞边聊最自然。" },
      { value: "D", emoji: "💥", label: "联合实弹演习——一起端掉一个敌方的雷达站。" },
    ],
  },
] as const;

const HELICOPTER_PHOTOS = [
  "/helicopter1.png",
  "/helicopter2.png",
  "/helicopter3.png",
];

export default function SurveyPage() {
  const searchParams = useSearchParams();
  const [referralCode] = useState<string>(() => {
    const fromUrl = typeof window !== "undefined"
      ? searchParams.get("code") ?? ""
      : "";
    if (fromUrl) {
      try { localStorage.setItem("referralCode", fromUrl); } catch {}
      return fromUrl;
    }
    try { return localStorage.getItem("referralCode") ?? ""; } catch { return ""; }
  });

  const [savedState] = useState<Partial<PersistedSurveyState>>(() =>
    loadPersistedSurveyState()
  );
  const [gender, setGender] = useState<Gender>(
    (savedState.gender as Gender) || ""
  );
  const [datingPreference, setDatingPreference] = useState<DatingPref>(
    (savedState.datingPreference as DatingPref) || ""
  );
  const [genderDone, setGenderDone] = useState(Boolean(savedState.genderDone));

  // Helicopter quiz states
  const [heliPhase, setHeliPhase] = useState<null | "quiz" | "loading" | "result">(null);
  const [heliStep, setHeliStep] = useState(0);
  const [heliAnswers, setHeliAnswers] = useState<Record<string, string>>({});
  const [showHeliSplash, setShowHeliSplash] = useState(false);
  const heliSplashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedVersion, setSelectedVersion] = useState<VersionId | null>(
    savedState.selectedVersion === "v3-lite" || savedState.selectedVersion === "v2"
      ? savedState.selectedVersion
      : null
  );
  const [currentIndex, setCurrentIndex] = useState(
    typeof savedState.currentIndex === "number" ? savedState.currentIndex : 0
  );
  const [answers, setAnswers] = useState<Answers>(
    savedState.answers && typeof savedState.answers === "object"
      ? savedState.answers
      : {}
  );
  const [email, setEmail] = useState(savedState.email || "");
  const [displayName, setDisplayName] = useState(savedState.displayName || "");
  const [education, setEducation] = useState(savedState.education || "");
  const [schoolTier, setSchoolTier] = useState(savedState.schoolTier || "");
  const [submitted, setSubmitted] = useState(false);
  const [emailSendIssue, setEmailSendIssue] = useState<string | null>(null);
  const [liteAnswers, setLiteAnswers] = useState<Answers>(
    savedState.liteAnswers && typeof savedState.liteAnswers === "object"
      ? savedState.liteAnswers
      : {}
  );
  const [showDeepIntro, setShowDeepIntro] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLiteData = Object.keys(liteAnswers).length > 0;

  // Save state on change
  useEffect(() => {
    // Don't save if submitted
    if (submitted) {
      localStorage.removeItem("surveyState");
      return;
    }

    try {
      const stateToSave = {
        answers,
        liteAnswers,
        selectedVersion,
        currentIndex,
        gender,
        datingPreference,
        genderDone,
        email,
        displayName,
        education,
        schoolTier,
      };
      localStorage.setItem("surveyState", JSON.stringify(stateToSave));
    } catch (e) {
      console.error("Failed to save survey state:", e);
    }
  }, [answers, liteAnswers, selectedVersion, currentIndex, gender, datingPreference, genderDone, email, displayName, education, schoolTier, submitted]);

  const helicopterQuery = trpc.survey.getHelicopterPilots.useQuery(undefined, {
    enabled: heliPhase === "result",
  });

  const registerHeliMutation = trpc.survey.registerHelicopterPilot.useMutation();

  const floatingHelicopters = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        // Deterministic layout to satisfy React purity rules.
        left: `${(i * 37) % 95}%`,
        duration: `${4 + ((i * 17) % 50) / 10}s`,
        delay: `${((i * 13) % 30) / 10}s`,
        size: `${1.5 + ((i * 19) % 20) / 10}rem`,
      })),
    []
  );

  const mutation = trpc.survey.submitPublic.useMutation({
    onSuccess: (result) => {
      if (result.emailSent) {
        setEmailSendIssue(null);
      } else {
        setEmailSendIssue("首次验证邮件发送失败，请点击下方按钮重新发送。");
      }
      setSubmitted(true);
    },
  });

  const resendMutation = trpc.survey.resendConfirmation.useMutation();
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResend = () => {
    if (!email || resendMutation.isPending || resendCooldown > 0) return;
    resendMutation.reset();
    resendMutation.mutate({ email }, {
      onSettled: () => setResendCooldown(5),
    });
  };

  const version = selectedVersion ? getSurveyVersion(selectedVersion) : null;
  const sections = version?.sections ?? [];
  const allQuestions = sections.flatMap((s) => s.questions);

  const isLite = selectedVersion === "v3-lite";
  const totalSteps = isLite
    ? allQuestions.length + 1
    : sections.length + 1;

  const isEmailStep = isLite
    ? currentIndex >= allQuestions.length
    : currentIndex >= sections.length;

  const progress = ((currentIndex + 1) / totalSteps) * 100;

  const updateAnswer = useCallback(
    (questionId: string, value: number | string | string[]) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
    },
    []
  );

  const handleLiteAnswer = useCallback(
    (questionId: string, value: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 350);
    },
    []
  );

  function handleNext() {
    if (!isEmailStep) {
      setCurrentIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleBack() {
    if (currentIndex > 0) {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      setCurrentIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleSubmit() {
    if (!email || !displayName || !education || !schoolTier) return;
    setEmailSendIssue(null);
    const mergedAnswers = { ...liteAnswers, ...answers };
    const versionTag = hasLiteData
      ? "v3-lite+v2"
      : (selectedVersion ?? undefined);
    mutation.mutate({
      email,
      displayName,
      gender: gender || undefined,
      datingPreference: datingPreference || undefined,
      education,
      schoolTier,
      answers: mergedAnswers,
      surveyVersion: versionTag,
      referralCode: referralCode || undefined,
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

  // ─── Phase -1: Gender Selection ───

  if (!genderDone) {
    // Sub-phase: Helicopter Quiz (3 questions)
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
            <h1 className="text-xl sm:text-2xl font-serif mb-1">
              {hq.question}
            </h1>
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
              <button
                type="button"
                onClick={() => setHeliStep((s) => s - 1)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← 上一题
              </button>
            </div>
          )}
        </div>
      );
    }

    // Sub-phase: Helicopter Loading Screen
    if (heliPhase === "loading") {
      return (
        <div className="animate-fade-in flex flex-col items-center justify-center py-24">
          <div className="text-6xl mb-8 animate-heart-pulse">💗</div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold mb-6 text-center">
            匹配中...
          </h2>
          <div className="w-full max-w-xs h-3 bg-muted rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-primary rounded-full transition-none"
              style={{
                animation: "heli-progress 3s linear forwards",
              }}
            />
          </div>
        </div>
      );
    }

    // Sub-phase: Helicopter Match Result (fullscreen)
    if (heliPhase === "result") {
      const pilotNames = helicopterQuery.data?.names ?? [];
      const pilotCount = helicopterQuery.data?.count ?? 0;
      const allPilots = displayName.trim()
        ? [`${displayName.trim()}`, ...pilotNames]
        : pilotNames;
      const totalCount = displayName.trim() ? pilotCount + 1 : pilotCount;

      return (
        <div className="animate-fade-in">
          {/* ── Splash overlay: ❤️ + 🚁 ── */}
          {showHeliSplash && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-xl animate-splash-overlay cursor-pointer"
              onClick={() => {
                setShowHeliSplash(false);
                if (heliSplashTimer.current) clearTimeout(heliSplashTimer.current);
              }}
            >
              <div className="flex items-center gap-6">
                <span className="text-[10rem] sm:text-[14rem] leading-none animate-splash-icon animate-heart-pulse">
                  ❤️
                </span>
                <span className="text-[10rem] sm:text-[14rem] leading-none animate-splash-icon" style={{ animationDelay: "0.3s" }}>
                  🚁
                </span>
              </div>
            </div>
          )}

          {/* Floating helicopters background */}
          <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
            {floatingHelicopters.map((h) => (
              <div
                key={h.id}
                className="absolute animate-helicopter-float"
                style={{
                  left: h.left,
                  fontSize: h.size,
                  ["--float-duration" as string]: h.duration,
                  ["--float-delay" as string]: h.delay,
                }}
              >
                🚁
              </div>
            ))}
          </div>

          <div className="relative z-50">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4 animate-helicopter-shake">🚁</div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold mb-2">
                测试完成！这是你的心动对象
              </h1>
              <p className="text-muted-foreground">
                根据你的战术偏好，我们为你匹配了以下武装直升机
              </p>
            </div>

            {/* Helicopter photo gallery */}
            <div className="grid gap-4 mb-8">
              {HELICOPTER_PHOTOS.map((src, i) => (
                <div
                  key={src}
                  className="relative rounded-2xl overflow-hidden border-2 border-border shadow-lg"
                >
                  <Image
                    src={src}
                    alt={`心动武装直升机 ${i + 1}`}
                    width={700}
                    height={400}
                    className="w-full h-auto object-cover"
                    priority={i === 0}
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
                    <p className="text-white font-medium text-sm">
                      心动对象 #{i + 1}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Nickname input */}
            <div className="bg-card rounded-2xl border border-border p-6 mb-4 shadow-sm">
              <label
                htmlFor="heliNickname"
                className="block text-lg font-serif font-bold text-center mb-1"
              >
                请留下你的昵称，飞行员！
              </label>
              <p className="text-xs text-muted-foreground text-center mb-4">
                你的代号将加入武装直升机编队
              </p>
              <input
                id="heliNickname"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="输入你的飞行代号..."
                className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-foreground text-center placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
              />
            </div>

            {/* Helicopter pilots list */}
            <div className="bg-card rounded-2xl border border-border p-6 mb-8 shadow-sm">
              <p className="text-lg text-primary font-medium text-center mb-4">
                当前共有{" "}
                <span className="text-2xl font-bold">{totalCount}</span>{" "}
                位武装直升机飞行员！
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {allPilots.map((name, i) => (
                  <span
                    key={i}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                      i === 0 && displayName.trim()
                        ? "bg-primary text-primary-foreground shadow-md scale-105"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    🚁 {name}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (displayName.trim()) {
                  registerHeliMutation.mutate({ displayName: displayName.trim() });
                }
                setHeliPhase(null);
              }}
              className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium text-lg hover:bg-accent transition-colors"
            >
              太酷了！继续填写 →
            </button>
          </div>
        </div>
      );
    }

    // Main gender selection UI
    return (
      <div className="animate-fade-in">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-serif mb-3">
            先认识一下你
          </h1>
          <p className="text-muted-foreground">
            这些信息会帮我们为你找到更合适的人
          </p>
        </div>

        <div className="space-y-8">
          {/* 你的性别 */}
          <div>
            <label className="block text-sm font-medium mb-3">你的性别</label>
            <div className="grid grid-cols-2 gap-3">
              {GENDER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setGender(opt.value);
                    if (opt.value === "武装直升机") {
                      setHeliPhase("quiz");
                      setHeliStep(0);
                      setHeliAnswers({});
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all",
                    gender === opt.value
                      ? "border-primary bg-primary/10 text-primary scale-[1.02] shadow-md"
                      : "border-border bg-card text-foreground hover:border-primary/40 hover:shadow-sm"
                  )}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 你想 date 的性别 */}
          <div>
            <label className="block text-sm font-medium mb-3">
              你想 date 的性别
            </label>
            <div className="grid grid-cols-3 gap-3">
              {DATING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDatingPreference(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 px-3 py-4 rounded-xl border-2 text-sm font-medium transition-all",
                    datingPreference === opt.value
                      ? "border-primary bg-primary/10 text-primary scale-[1.02] shadow-md"
                      : "border-border bg-card text-foreground hover:border-primary/40 hover:shadow-sm"
                  )}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10">
          <button
            type="button"
            disabled={!gender || !datingPreference}
            onClick={() => setGenderDone(true)}
            className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium text-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            继续 →
          </button>
        </div>
      </div>
    );
  }

  // ─── Phase 0: Version Selector ───

  if (!selectedVersion) {
    return (
      <div className="animate-fade-in">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-serif mb-3">选择你的测试版本</h1>
          <p className="text-muted-foreground">
            不管哪个版本，都能帮你找到那个人
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Lite card */}
          <button
            type="button"
            onClick={() => setSelectedVersion("v3-lite")}
            className="group text-left rounded-2xl border-2 border-border p-6 hover:border-primary/50 hover:shadow-xl transition-all duration-300"
          >
            <div className="text-center mb-5">
              <div className="text-5xl mb-3">🎯</div>
              <h2 className="text-xl font-serif font-bold">快速测试</h2>
              <p className="text-sm text-muted-foreground mt-1">
                1-3分钟 · 10道趣味选择题
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                用表情包探索你的恋爱人格
              </p>
            </div>

            <div className="bg-muted/50 rounded-xl p-4 mb-5">
              <p className="text-xs text-muted-foreground text-center mb-3">
                例题预览
              </p>
              <p className="text-sm font-medium text-center mb-3">
                收到喜欢的人消息，你的第一反应？
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { image: "/数据标注/Q2A.png", text: "强忍3分钟才回" },
                  { image: "/数据标注/Q2B.png", text: "秒回！手速超越打游戏" },
                  { image: "/数据标注/Q2C.png", text: "截图发群，召唤智囊团" },
                  { image: "/数据标注/Q2D.png", text: "精心编辑一条完美回复" },
                ].map((item) => (
                  <div
                    key={item.image}
                    className="bg-card rounded-lg overflow-hidden text-center"
                  >
                    <img
                      src={item.image}
                      alt={item.text}
                      className="w-full aspect-square object-cover"
                    />
                    <span className="text-xs text-muted-foreground block px-1.5 py-1.5">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center py-2.5 rounded-full bg-primary text-primary-foreground font-medium group-hover:bg-accent transition-colors">
              选择快速版
            </div>
          </button>

          {/* Deep card */}
          <button
            type="button"
            onClick={() => setSelectedVersion("v2")}
            className="group text-left rounded-2xl border-2 border-border p-6 hover:border-primary/50 hover:shadow-xl transition-all duration-300"
          >
            <div className="text-center mb-5">
              <div className="text-5xl mb-3">🔬</div>
              <h2 className="text-xl font-serif font-bold">深度测试</h2>
              <p className="text-sm text-muted-foreground mt-1">
                10-15分钟 · 七大维度全面解析
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                覆盖安全感、冲突、现实观等深层维度
              </p>
            </div>

            <div className="bg-muted/50 rounded-xl p-4 mb-5">
              <p className="text-xs text-muted-foreground text-center mb-3">
                例题预览
              </p>
              <p className="text-sm font-medium text-center mb-3">
                在走向长期关系时，你如何看待原生家庭的资源与责任？
              </p>
              <div className="flex flex-col gap-1.5">
                {[
                  "A. 独立自主型：习惯靠自己打拼，尽量不依赖双方父母，也不希望长辈过度干预。",
                  "B. 资源整合型：认可家庭作为后盾的支持（如购房首付），愿意接受长辈合理的建议。",
                  "C. 责任反哺型：家庭需要我未来承担较多照顾责任，希望伴侣能理解并共同分担。",
                  "D. 情感疏离型：与原生家庭联系较少，未来希望建立完全独立于原生家庭的小家庭。",
                ].map((text) => (
                  <div
                    key={text}
                    className="bg-card rounded-lg px-3 py-2 text-xs"
                  >
                    {text}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center py-2.5 rounded-full bg-primary text-primary-foreground font-medium group-hover:bg-accent transition-colors">
              选择深度版
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ─── Phase: Deep Intro Transition ───

  if (showDeepIntro) {
    return (
      <div className="animate-fade-in text-center py-12">
        <div className="text-5xl mb-6">🔬</div>
        <h1 className="text-3xl font-serif mb-3">准备进入深度版</h1>
        <p className="text-muted-foreground mb-8">
          深度版将从七个心理学维度全面解析你的关系基因
        </p>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm max-w-md mx-auto text-left">
          <div className="flex items-center gap-2 text-sm text-primary mb-4 font-medium">
            <span>✓</span>
            <span>快速版答案已保存，将与深度版合并匹配</span>
          </div>

          <ul className="space-y-3 text-sm text-muted-foreground mb-6">
            <li className="flex gap-3 items-start">
              <span className="text-base leading-none mt-0.5">🛡️</span>
              <span>安全联结 — 你的情感锚点在哪里？</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-base leading-none mt-0.5">🤝</span>
              <span>互动模式 — 如何相处与化解冲突？</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-base leading-none mt-0.5">🏙️</span>
              <span>现实坐标 — 城市、经济、家庭观</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-base leading-none mt-0.5">🧭</span>
              <span>意义系统 — 什么在驱动你的人生？</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-base leading-none mt-0.5">🚀</span>
              <span>动力发展 — 你们能一起升级吗？</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-base leading-none mt-0.5">☕</span>
              <span>日常系统 — 在生活里能落地吗？</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-base leading-none mt-0.5">💫</span>
              <span>灵魂共振 — 最深处渴望怎样的连接？</span>
            </li>
          </ul>

          <p className="text-xs text-muted-foreground mb-5">
            大约需要 10-15 分钟 · 无需重新填写邮箱
          </p>

          <button
            type="button"
            onClick={startDeep}
            className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium text-lg hover:bg-accent transition-colors"
          >
            开始深度版 →
          </button>
        </div>
      </div>
    );
  }

  // ─── Phase: Submitted ───

  if (submitted) {
    if (isLite) {
      return (
        <div className="animate-fade-in text-center py-16">
          <div className="text-5xl mb-6">🎉</div>
          <h1 className="text-3xl font-serif mb-4 text-primary">提交成功！</h1>
          <p className="text-muted-foreground text-lg mb-2">
            感谢你完成快速版测试
          </p>

          {emailSendIssue ? (
            <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-700 rounded-2xl p-6 max-w-md mx-auto mb-6 text-left">
              <div className="flex items-start gap-3">
                <span className="text-3xl shrink-0">⚠️</span>
                <div className="w-full">
                  <h3 className="font-serif text-lg font-bold text-red-900 dark:text-red-200 mb-1">
                    验证邮件发送失败
                  </h3>
                  <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">
                    你的问卷已保存，但发送到{" "}
                    <span className="font-semibold">{email}</span>{" "}
                    的验证邮件未成功送达。请点击下方按钮重新发送。
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-400 font-semibold mt-2">
                    不验证邮箱就无法参与匹配！
                  </p>
                  <button
                    onClick={handleResend}
                    disabled={resendMutation.isPending || resendCooldown > 0}
                    className="mt-3 w-full py-2.5 bg-red-600 dark:bg-red-700 text-white rounded-full font-medium hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendMutation.isPending
                      ? "发送中..."
                      : resendCooldown > 0
                        ? `${resendCooldown}s 后可重新发送`
                        : resendMutation.isError
                          ? "发送失败，点击重试"
                          : resendMutation.isSuccess
                            ? "✓ 已发送！再发一次"
                            : "重新发送验证邮件"}
                  </button>
                  {resendMutation.isSuccess && resendCooldown <= 0 && (
                    <p className="text-xs text-red-700 dark:text-red-400 mt-2">
                      已发送！请检查收件箱和垃圾邮件文件夹。如还是没收到，可能是邮箱地址有误，可重新提交问卷修改。
                    </p>
                  )}
                  <p className="text-xs text-red-500/80 dark:text-red-600 mt-2">
                    验证链接 24 小时内有效
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-6 max-w-md mx-auto mb-6 text-left">
              <div className="flex items-start gap-3">
                <span className="text-3xl shrink-0">📬</span>
                <div>
                  <h3 className="font-serif text-lg font-bold text-amber-900 dark:text-amber-200 mb-1">
                    请去邮箱验证！
                  </h3>
                  <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                    我们已发送一封验证邮件到{" "}
                    <span className="font-semibold">{email}</span>
                    ，请点击邮件中的「验证邮箱」按钮。
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400 font-semibold mt-2">
                    只有验证邮箱后，才会进入每周匹配！
                  </p>
                  <div className="text-xs text-amber-600 dark:text-amber-500 mt-3 flex flex-col gap-2">
                    <span>没收到？部分邮箱可能需要 1-2 分钟送达，也请检查垃圾邮件文件夹</span>
                    <button
                      onClick={handleResend}
                      disabled={resendMutation.isPending || resendCooldown > 0}
                      className="self-start px-3 py-1.5 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded-md font-medium hover:bg-amber-300 dark:hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resendMutation.isPending
                        ? "发送中..."
                        : resendCooldown > 0
                          ? `${resendCooldown}s 后可重新发送`
                          : resendMutation.isError
                            ? "发送失败，点击重试"
                            : resendMutation.isSuccess
                              ? "再发一次"
                              : "重新发送验证邮件"}
                    </button>
                    {resendMutation.isSuccess && resendCooldown <= 0 && (
                      <span className="text-amber-700 dark:text-amber-400">
                        已发送！如果还是没收到，可能是邮箱地址有误，可以重新提交问卷修改
                      </span>
                    )}
                    <span className="text-amber-500/80 dark:text-amber-600">
                      验证链接 24 小时内有效
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-card rounded-2xl p-6 border border-border shadow-sm max-w-md mx-auto text-left">
            <h3 className="font-serif text-lg mb-2">🔬 想要更精准的匹配？</h3>
            <p className="text-sm text-muted-foreground mb-4">
              深度版覆盖七大心理学维度，从安全感、冲突模式到现实规划，帮你找到更深层次契合的人。
            </p>
            <button
              type="button"
              onClick={handleTryDeep}
              className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-accent transition-colors"
            >
              继续完成深度版 →
            </button>
          </div>

          <div className="mt-6 bg-card rounded-2xl p-6 border border-border shadow-sm max-w-md mx-auto text-left">
            <h3 className="font-serif text-lg mb-3">验证邮箱后会发生什么？</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">1.</span>
                点击邮件中的验证链接，激活你的匹配资格
              </li>
              <li className="flex gap-2">
                <span className="text-primary">2.</span>
                我们会在每周匹配轮次中为你寻找最契合的对象
              </li>
              <li className="flex gap-2">
                <span className="text-primary">3.</span>
                匹配成功后，邮件通知你对方的联系方式和匹配原因
              </li>
            </ul>
          </div>
        </div>
      );
    }

    return (
      <div className="animate-fade-in text-center py-16">
        <div className="text-5xl mb-6">🎉</div>
        <h1 className="text-3xl font-serif mb-4 text-primary">提交成功！</h1>
        {hasLiteData ? (
          <p className="text-muted-foreground text-lg mb-2">
            快速版 + 深度版全部完成，匹配精准度拉满！
          </p>
        ) : (
          <p className="text-muted-foreground text-lg mb-2">
            感谢你完成《关系基因匹配测试·深度版》
          </p>
        )}

        {emailSendIssue ? (
          <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-700 rounded-2xl p-6 max-w-md mx-auto mb-6 text-left">
            <div className="flex items-start gap-3">
              <span className="text-3xl shrink-0">⚠️</span>
              <div className="w-full">
                <h3 className="font-serif text-lg font-bold text-red-900 dark:text-red-200 mb-1">
                  验证邮件发送失败
                </h3>
                <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">
                  你的问卷已保存，但发送到{" "}
                  <span className="font-semibold">{email}</span>{" "}
                  的验证邮件未成功送达。请点击下方按钮重新发送。
                </p>
                <p className="text-sm text-red-700 dark:text-red-400 font-semibold mt-2">
                  不验证邮箱就无法参与匹配！
                </p>
                <button
                  onClick={handleResend}
                  disabled={resendMutation.isPending || resendCooldown > 0}
                  className="mt-3 w-full py-2.5 bg-red-600 dark:bg-red-700 text-white rounded-full font-medium hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendMutation.isPending
                    ? "发送中..."
                    : resendCooldown > 0
                      ? `${resendCooldown}s 后可重新发送`
                      : resendMutation.isError
                        ? "发送失败，点击重试"
                        : resendMutation.isSuccess
                          ? "✓ 已发送！再发一次"
                          : "重新发送验证邮件"}
                </button>
                {resendMutation.isSuccess && resendCooldown <= 0 && (
                  <p className="text-xs text-red-700 dark:text-red-400 mt-2">
                    已发送！请检查收件箱和垃圾邮件文件夹。如还是没收到，可能是邮箱地址有误，可重新提交问卷修改。
                  </p>
                )}
                <p className="text-xs text-red-500/80 dark:text-red-600 mt-2">
                  验证链接 24 小时内有效
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-6 max-w-md mx-auto mb-6 text-left">
            <div className="flex items-start gap-3">
              <span className="text-3xl shrink-0">📬</span>
              <div>
                <h3 className="font-serif text-lg font-bold text-amber-900 dark:text-amber-200 mb-1">
                  请去邮箱验证！
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                  我们已发送一封验证邮件到{" "}
                  <span className="font-semibold">{email}</span>
                  ，请点击邮件中的「验证邮箱」按钮。
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400 font-semibold mt-2">
                  只有验证邮箱后，才会进入每周匹配！
                </p>
                <div className="text-xs text-amber-600 dark:text-amber-500 mt-3 flex flex-col gap-2">
                  <span>没收到？部分邮箱可能需要 1-2 分钟送达，也请检查垃圾邮件文件夹</span>
                  <button
                    onClick={handleResend}
                    disabled={resendMutation.isPending || resendCooldown > 0}
                    className="self-start px-3 py-1.5 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded-md font-medium hover:bg-amber-300 dark:hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendMutation.isPending
                      ? "发送中..."
                      : resendCooldown > 0
                        ? `${resendCooldown}s 后可重新发送`
                        : resendMutation.isError
                          ? "发送失败，点击重试"
                          : resendMutation.isSuccess
                            ? "再发一次"
                            : "重新发送验证邮件"}
                  </button>
                  {resendMutation.isSuccess && resendCooldown <= 0 && (
                    <span className="text-amber-700 dark:text-amber-400">
                      已发送！如果还是没收到，可能是邮箱地址有误，可以重新提交问卷修改
                    </span>
                  )}
                  <span className="text-amber-500/80 dark:text-amber-600">
                    验证链接 24 小时内有效
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {hasLiteData && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 max-w-md mx-auto mb-6">
            <p className="text-sm text-primary font-medium">
              ✓ 快速版 10 题 + 深度版七大维度，共计覆盖 13 个匹配维度
            </p>
          </div>
        )}

        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm max-w-md mx-auto text-left">
          <h3 className="font-serif text-lg mb-3">验证邮箱后会发生什么？</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary">1.</span>
              点击邮件中的验证链接，激活你的匹配资格
            </li>
            <li className="flex gap-2">
              <span className="text-primary">2.</span>
              我们会在每周匹配轮次中为你寻找最契合的对象
            </li>
            <li className="flex gap-2">
              <span className="text-primary">3.</span>
              匹配成功后，邮件通知你对方的联系方式和匹配原因
            </li>
          </ul>
        </div>
      </div>
    );
  }

  // ─── Phase: Email Step ───

  if (isEmailStep) {
    return (
      <div className="animate-fade-in">
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

        {hasLiteData && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-6 flex items-center gap-2">
            <span className="text-primary text-sm font-medium">✓</span>
            <span className="text-sm text-primary">
              快速版 + 深度版答案已合并，信息已自动填入
            </span>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif mb-3">
            差最后一步！
          </h1>
          <p className="text-muted-foreground">
            {hasLiteData
              ? "确认你的信息无误，即可提交。"
              : "留下你的邮箱和昵称，我们会把匹配结果发送给你。"}
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium mb-2"
            >
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
            <label className="block text-sm font-medium mb-2">
              最高学历
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["高中", "本科", "硕士", "博士"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setEducation(opt)}
                  className={cn(
                    "py-2.5 rounded-xl border text-sm font-medium transition-all",
                    education === opt
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              请填写你目前已取得或正在就读的最高学历（在读也算）
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">院校层级</label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: "清北", label: "清北", sub: "清华 / 北大" },
                  { value: "C9", label: "C9", sub: "复旦、交大、浙大等" },
                  { value: "985", label: "985", sub: "或 QS 前 50" },
                  { value: "211", label: "211", sub: "或 QS 前 100" },
                  { value: "一本", label: "一本", sub: "或 QS 前 300" },
                  { value: "其他", label: "其他", sub: "二本 / 专科 / 海外其他" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSchoolTier(opt.value)}
                  className={cn(
                    "py-2.5 px-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center gap-0.5",
                    schoolTier === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  )}
                >
                  <span>{opt.label}</span>
                  <span className={cn("text-xs font-normal", schoolTier === opt.value ? "text-primary/70" : "text-muted-foreground")}>{opt.sub}</span>
                </button>
              ))}
            </div>
            {education === "高中" && (
              <p className="text-xs text-muted-foreground mt-2">
                高中生可选「其他」，不影响匹配
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              海外院校请参考 QS 排名对应选择；在读请选当前就读院校层级
            </p>
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
            type="button"
            onClick={handleBack}
            className="flex-1 py-3 rounded-full border border-border text-foreground font-medium hover:bg-muted transition-colors"
          >
            上一步
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={mutation.isPending || !email || !displayName || !education || !schoolTier}
            className="flex-1 py-3 rounded-full bg-primary text-primary-foreground font-medium text-lg hover:bg-accent transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? "提交中..." : "提交问卷"}
          </button>
        </div>

        {mutation.error && (
          <p className="text-destructive text-sm mt-4 text-center">
            提交失败，请重试。如果问题持续存在，请联系{" "}
            <a
              href="mailto:hzy2210@gmail.com"
              className="underline hover:opacity-80"
            >
              hzy2210@gmail.com
            </a>
          </p>
        )}
      </div>
    );
  }

  // ─── Phase: Lite Survey (one question per screen) ───

  if (isLite) {
    const q = allQuestions[currentIndex] as SingleQuestion;
    return (
      <div key={currentIndex} className="animate-fade-in">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>
              {currentIndex + 1} / {allQuestions.length}
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

        {/* Question */}
        <EmojiCardSelect
          question={q.question}
          note={q.note}
          options={q.options}
          value={(answers[q.id] as string) ?? null}
          onChange={(v) => handleLiteAnswer(q.id, v)}
        />

        {/* Back button */}
        {currentIndex > 0 && (
          <div className="mt-6">
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← 上一题
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── Phase: Deep Survey (section-based) ───

  const section = sections[currentIndex];
  const isLastSurveySection = currentIndex === sections.length - 1;

  return (
    <div className="animate-fade-in">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>
            第 {currentIndex + 1} / {sections.length} 部分
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

      {/* Section header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-serif mb-2">
          {section.title}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          {section.description}
        </p>
      </div>

      {/* Questions */}
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

      {/* Navigation */}
      <div className="flex gap-3 mt-10">
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={handleBack}
            className="flex-1 py-3 rounded-full border border-border text-foreground font-medium hover:bg-muted transition-colors"
          >
            上一部分
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 py-3 rounded-full bg-primary text-primary-foreground font-medium text-lg hover:bg-accent transition-colors"
        >
          {isLastSurveySection ? "下一步：留下联系方式" : "下一部分"}
        </button>
      </div>
    </div>
  );
}
