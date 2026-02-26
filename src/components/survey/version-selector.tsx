"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { VersionId } from "./survey-types";

interface VersionSelectorProps {
  onSelect: (version: VersionId) => void;
}

export function VersionSelector({ onSelect }: VersionSelectorProps) {
  const [showArrow, setShowArrow] = useState(false);

  useEffect(() => {
    // Only show on small screens where the deep survey card is below fold
    const mq = window.matchMedia("(max-width: 767px)");
    if (!mq.matches) return;

    setShowArrow(true);

    const onScroll = () => {
      // Hide once user scrolls down enough to see the deep survey card
      if (window.scrollY > 120) setShowArrow(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
    <div className="animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-serif mb-3">选择你的测试版本</h1>
        <p className="text-muted-foreground">不管哪个版本，都能帮你找到那个人</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelect("v3-lite")}
          className="group text-left rounded-2xl border-2 border-border p-6 hover:border-primary/50 hover:shadow-xl transition-all duration-300"
        >
          <div className="text-center mb-5">
            <div className="text-5xl mb-3">🎯</div>
            <h2 className="text-xl font-serif font-bold">快速测试</h2>
            <p className="text-sm text-muted-foreground mt-1">1-3分钟 · 10道趣味选择题</p>
            <p className="text-xs text-muted-foreground mt-0.5">用表情包探索你的恋爱人格</p>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 mb-5">
            <p className="text-xs text-muted-foreground text-center mb-3">例题预览</p>
            <p className="text-sm font-medium text-center mb-3">收到喜欢的人消息，你的第一反应？</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { image: "/数据标注/Q2A.png", text: "强忍3分钟才回" },
                { image: "/数据标注/Q2B.png", text: "秒回！手速超越打游戏" },
                { image: "/数据标注/Q2C.png", text: "截图发群，召唤智囊团" },
                { image: "/数据标注/Q2D.png", text: "精心编辑一条完美回复" },
              ].map((item) => (
                <div key={item.image} className="bg-card rounded-lg overflow-hidden text-center">
                  <img src={item.image} alt={item.text} className="w-full aspect-square object-cover" />
                  <span className="text-xs text-muted-foreground block px-1.5 py-1.5">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center py-2.5 rounded-full bg-primary text-primary-foreground font-medium group-hover:bg-accent transition-colors">
            选择快速版
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelect("v2")}
          className="group text-left rounded-2xl border-2 border-border p-6 hover:border-primary/50 hover:shadow-xl transition-all duration-300"
        >
          <div className="text-center mb-5">
            <div className="text-5xl mb-3">🔬</div>
            <h2 className="text-xl font-serif font-bold">深度测试</h2>
            <p className="text-sm text-muted-foreground mt-1">10-15分钟 · 七大维度全面解析</p>
            <p className="text-xs text-muted-foreground mt-0.5">覆盖安全感、冲突、现实观等深层维度</p>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 mb-5">
            <p className="text-xs text-muted-foreground text-center mb-3">例题预览</p>
            <p className="text-sm font-medium text-center mb-3">在走向长期关系时，你如何看待原生家庭的资源与责任？</p>
            <div className="flex flex-col gap-1.5">
              {[
                "A. 独立自主型：习惯靠自己打拼，尽量不依赖双方父母，也不希望长辈过度干预。",
                "B. 资源整合型：认可家庭作为后盾的支持（如购房首付），愿意接受长辈合理的建议。",
                "C. 责任反哺型：家庭需要我未来承担较多照顾责任，希望伴侣能理解并共同分担。",
                "D. 情感疏离型：与原生家庭联系较少，未来希望建立完全独立于原生家庭的小家庭。",
              ].map((text) => (
                <div key={text} className="bg-card rounded-lg px-3 py-2 text-xs">{text}</div>
              ))}
            </div>
          </div>

          <div className="text-center py-2.5 rounded-full bg-primary text-primary-foreground font-medium group-hover:bg-accent transition-colors">
            选择深度版
          </div>
        </button>
      </div>

      {/* Neptune challenge entry */}
      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={() => onSelect("neptune")}
          className="group inline-flex items-center gap-2 px-5 py-3 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
        >
          <span className="text-xl">🔱</span>
          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
            挑战一下自己的直觉？猜猜别人是怎么填写的
          </span>
          <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform">→</span>
        </button>
      </div>

    </div>

    {/* Mobile scroll hint — rendered via portal to escape animate-fade-in transform */}
    {showArrow && createPortal(
      <button
        type="button"
        aria-label="向下滑动查看更多"
        onClick={() => { window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); setShowArrow(false); }}
        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1.5 animate-bounce md:hidden"
      >
        <span className="text-sm font-medium text-primary-foreground bg-primary/90 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-md border border-primary/60">
          下滑查看深度版 🔬
        </span>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>,
      document.body
    )}
    </>
  );
}
