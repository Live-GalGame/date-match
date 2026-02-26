"use client";

interface DeepIntroProps {
  onStart: () => void;
}

export function DeepIntro({ onStart }: DeepIntroProps) {
  return (
    <div className="animate-fade-in text-center py-12">
      <div className="text-5xl mb-6">🔬</div>
      <h1 className="text-3xl font-serif mb-3">准备进入深度版</h1>
      <p className="text-muted-foreground mb-8">深度版将从七个心理学维度全面解析你的关系基因</p>

      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm max-w-md mx-auto text-left">
        <div className="flex items-center gap-2 text-sm text-primary mb-4 font-medium">
          <span>✓</span>
          <span>快速版答案已保存，将与深度版合并匹配</span>
        </div>

        <ul className="space-y-3 text-sm text-muted-foreground mb-6">
          <li className="flex gap-3 items-start"><span className="text-base leading-none mt-0.5">🛡️</span><span>安全联结 — 你的情感锚点在哪里？</span></li>
          <li className="flex gap-3 items-start"><span className="text-base leading-none mt-0.5">🤝</span><span>互动模式 — 如何相处与化解冲突？</span></li>
          <li className="flex gap-3 items-start"><span className="text-base leading-none mt-0.5">🏙️</span><span>现实坐标 — 城市、经济、家庭观</span></li>
          <li className="flex gap-3 items-start"><span className="text-base leading-none mt-0.5">🧭</span><span>意义系统 — 什么在驱动你的人生？</span></li>
          <li className="flex gap-3 items-start"><span className="text-base leading-none mt-0.5">🚀</span><span>动力发展 — 你们能一起升级吗？</span></li>
          <li className="flex gap-3 items-start"><span className="text-base leading-none mt-0.5">☕</span><span>日常系统 — 在生活里能落地吗？</span></li>
          <li className="flex gap-3 items-start"><span className="text-base leading-none mt-0.5">💫</span><span>灵魂共振 — 最深处渴望怎样的连接？</span></li>
        </ul>

        <p className="text-xs text-muted-foreground mb-5">大约需要 10-15 分钟 · 无需重新填写邮箱</p>

        <button type="button" onClick={onStart} className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium text-lg hover:bg-accent transition-colors">
          开始深度版 →
        </button>
      </div>
    </div>
  );
}
