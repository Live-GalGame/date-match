"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { domToPng } from "modern-screenshot";
import { computePosterProfile } from "@/lib/poster-profile";
import { PosterPreview, PosterImageOverlay } from "./poster";
import { TURNSTILE_SITE_KEY } from "./survey-types";
import type { Answers, VersionId } from "./survey-types";

interface ResendState {
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
}

interface SubmittedStateProps {
  isLite: boolean;
  hasLiteData: boolean;
  email: string;
  displayName: string;
  emailSendIssue: string | null;
  answers: Answers;
  liteAnswers: Answers;
  selectedVersion: VersionId | null;
  turnstileRef: React.RefObject<TurnstileInstance | null>;
  turnstileToken: string;
  setTurnstileToken: (v: string) => void;
  handleResend: () => void;
  resendState: ResendState;
  resendCooldown: number;
  onTryDeep?: () => void;
}

function EmailStatusBlock({
  emailSendIssue, email, handleResend, resendState, resendCooldown,
}: Pick<SubmittedStateProps, "emailSendIssue" | "email" | "handleResend" | "resendState" | "resendCooldown">) {
  if (emailSendIssue) {
    return (
      <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-700 rounded-2xl p-6 max-w-md mx-auto mb-6 text-left">
        <div className="flex items-start gap-3">
          <span className="text-3xl shrink-0">⚠️</span>
          <div className="w-full">
            <h3 className="font-serif text-lg font-bold text-red-900 dark:text-red-200 mb-1">验证邮件发送失败</h3>
            <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">
              你的问卷已保存，但发送到 <span className="font-semibold">{email}</span> 的验证邮件未成功送达。请点击下方按钮重新发送。
            </p>
            <p className="text-sm text-red-700 dark:text-red-400 font-semibold mt-2">不验证邮箱就无法参与匹配！</p>
            <button
              onClick={handleResend}
              disabled={resendState.isPending || resendCooldown > 0}
              className="mt-3 w-full py-2.5 bg-red-600 dark:bg-red-700 text-white rounded-full font-medium hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendState.isPending ? "发送中..." : resendCooldown > 0 ? `${resendCooldown}s 后可重新发送` : resendState.isError ? "发送失败，点击重试" : resendState.isSuccess ? "✓ 已发送！再发一次" : "重新发送验证邮件"}
            </button>
            {resendState.isSuccess && resendCooldown <= 0 && (
              <p className="text-xs text-red-700 dark:text-red-400 mt-2">已发送！请检查收件箱和垃圾邮件文件夹。如还是没收到，可能是邮箱地址有误，可重新提交问卷修改。</p>
            )}
            <p className="text-xs text-red-500/80 dark:text-red-600 mt-2">验证链接 24 小时内有效</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-6 max-w-md mx-auto mb-6 text-left">
      <div className="flex items-start gap-3">
        <span className="text-3xl shrink-0">📬</span>
        <div>
          <h3 className="font-serif text-lg font-bold text-amber-900 dark:text-amber-200 mb-1">请去邮箱验证！</h3>
          <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
            我们已发送一封验证邮件到 <span className="font-semibold">{email}</span>，请点击邮件中的「验证邮箱」按钮。
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-400 font-semibold mt-2">只有验证邮箱后，才会进入每周匹配！</p>
          <div className="text-xs text-amber-600 dark:text-amber-500 mt-3 flex flex-col gap-2">
            <span>没收到？部分邮箱可能需要 1-2 分钟送达，也请检查垃圾邮件文件夹</span>
            <button
              onClick={handleResend}
              disabled={resendState.isPending || resendCooldown > 0}
              className="self-start px-3 py-1.5 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded-md font-medium hover:bg-amber-300 dark:hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendState.isPending ? "发送中..." : resendCooldown > 0 ? `${resendCooldown}s 后可重新发送` : resendState.isError ? "发送失败，点击重试" : resendState.isSuccess ? "再发一次" : "重新发送验证邮件"}
            </button>
            {resendState.isSuccess && resendCooldown <= 0 && (
              <span className="text-amber-700 dark:text-amber-400">已发送！如果还是没收到，可能是邮箱地址有误，可以重新提交问卷修改</span>
            )}
            <span className="text-amber-500/80 dark:text-amber-600">验证链接 24 小时内有效</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function VerificationSteps() {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-sm max-w-md mx-auto text-left mb-6">
      <h3 className="font-serif text-lg mb-3">验证邮箱后会发生什么？</h3>
      <ul className="space-y-2 text-sm text-muted-foreground">
        <li className="flex gap-2"><span className="text-primary">1.</span>点击邮件中的验证链接，激活你的匹配资格</li>
        <li className="flex gap-2"><span className="text-primary">2.</span>我们会在每周匹配轮次中为你寻找最契合的对象</li>
        <li className="flex gap-2"><span className="text-primary">3.</span>匹配成功后，邮件通知你对方的联系方式和匹配原因</li>
      </ul>
    </div>
  );
}

export function SubmittedState({
  isLite, hasLiteData, email, displayName,
  emailSendIssue, answers, liteAnswers, selectedVersion,
  turnstileRef, setTurnstileToken,
  handleResend, resendState, resendCooldown,
  onTryDeep,
}: SubmittedStateProps) {
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [posterScale, setPosterScale] = useState(0.45);
  const posterRef = useRef<HTMLDivElement>(null);
  const posterWrapperRef = useRef<HTMLDivElement>(null);

  const posterProfile = useMemo(() => {
    const ver = (selectedVersion ?? "v2") as "v3-lite" | "v2";
    return computePosterProfile(answers, ver, hasLiteData ? liteAnswers : undefined);
  }, [answers, liteAnswers, hasLiteData, selectedVersion]);

  useEffect(() => {
    function calcScale() {
      if (!posterWrapperRef.current) return;
      setPosterScale(posterWrapperRef.current.getBoundingClientRect().width / 400);
    }
    calcScale();
    window.addEventListener("resize", calcScale);
    return () => window.removeEventListener("resize", calcScale);
  }, []);

  const generatePoster = async () => {
    if (!posterRef.current) return;
    try {
      setIsGeneratingPoster(true);
      const dataUrl = await domToPng(posterRef.current, { scale: 2, backgroundColor: "#fdf6f0" });
      setGeneratedImage(dataUrl);
      const isWeChat = /MicroMessenger/i.test(navigator.userAgent);
      if (!isWeChat) {
        const link = document.createElement("a");
        link.download = `date-match-report-${displayName || "user"}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error("生成海报失败", err);
      alert("生成海报失败，请稍后重试");
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  const myShareCode = typeof window !== "undefined" ? localStorage.getItem("myShareCode") || "" : "";
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : "https://www.date-match.online"}/?code=${myShareCode}`;

  return (
    <div className="animate-fade-in text-center py-16">
      <div className="text-5xl mb-6">🎉</div>
      <h1 className="text-3xl font-serif mb-4 text-primary">提交成功！</h1>

      {isLite ? (
        <p className="text-muted-foreground text-lg mb-2">感谢你完成快速版测试</p>
      ) : hasLiteData ? (
        <p className="text-muted-foreground text-lg mb-2">快速版 + 深度版全部完成，匹配精准度拉满！</p>
      ) : (
        <p className="text-muted-foreground text-lg mb-2">感谢你完成《关系基因匹配测试·深度版》</p>
      )}

      {TURNSTILE_SITE_KEY && (
        <div className="flex justify-center mb-4">
          <Turnstile
            ref={turnstileRef}
            siteKey={TURNSTILE_SITE_KEY}
            onSuccess={(token) => setTurnstileToken(token)}
            onExpire={() => setTurnstileToken("")}
            onError={() => setTurnstileToken("")}
          />
        </div>
      )}

      <EmailStatusBlock
        emailSendIssue={emailSendIssue}
        email={email}
        handleResend={handleResend}
        resendState={resendState}
        resendCooldown={resendCooldown}
      />

      {!isLite && hasLiteData && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 max-w-md mx-auto mb-6">
          <p className="text-sm text-primary font-medium">✓ 快速版 10 题 + 深度版七大维度，共计覆盖 13 个匹配维度</p>
        </div>
      )}

      <PosterPreview
        wrapperRef={posterWrapperRef}
        posterRef={posterRef}
        posterScale={posterScale}
        archetype={posterProfile.archetype}
        displayName={displayName}
        shareUrl={shareUrl}
        bars={posterProfile.bars}
      />

      <button
        type="button"
        onClick={generatePoster}
        disabled={isGeneratingPoster}
        className="w-full max-w-md mx-auto mb-6 block py-3 rounded-full bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
      >
        {isGeneratingPoster ? "生成中..." : "📸 保存海报到相册"}
      </button>

      {isLite && onTryDeep && (
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm max-w-md mx-auto text-left">
          <h3 className="font-serif text-lg mb-2">🔬 想要更精准的匹配？</h3>
          <p className="text-sm text-muted-foreground mb-4">深度版覆盖七大心理学维度，从安全感、冲突模式到现实规划，帮你找到更深层次契合的人。</p>
          <button type="button" onClick={onTryDeep} className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-accent transition-colors">
            继续完成深度版 →
          </button>
        </div>
      )}

      <VerificationSteps />

      <PosterImageOverlay src={generatedImage} onClose={() => setGeneratedImage(null)} />
    </div>
  );
}
