"use client";

import { QRCodeSVG } from "qrcode.react";

const POSTER_FONT = "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', sans-serif";

export function PosterPreview({ wrapperRef, posterRef, posterScale, archetype, displayName, shareUrl, bars }: {
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  posterRef: React.RefObject<HTMLDivElement | null>;
  posterScale: number;
  archetype: string;
  displayName: string;
  shareUrl: string;
  bars: Array<{ left: string; right: string; pct: number; label: string }>;
}) {
  return (
    <div ref={wrapperRef} className="max-w-md mx-auto mb-6 rounded-2xl overflow-hidden border-2 border-border shadow-lg">
      <div className="relative w-full" style={{ paddingBottom: "200%" }}>
        <div className="absolute inset-0 origin-top-left" style={{ width: 400, height: 800, transform: `scale(${posterScale})` }}>
          <div ref={posterRef} style={{ width: 400, height: 800, background: "#fdf6f0", color: "#2d1b14", fontFamily: POSTER_FONT, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "36px 32px 0", textAlign: "center" }}>
              <div style={{ color: "#8b225280", fontSize: 11, letterSpacing: "0.25em", marginBottom: 8, fontWeight: 500 }}>DATE-MATCH · 关系基因报告</div>
              <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.3 }}>寻找与我<br />灵魂共振的人</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 0 20px" }}>
              <div style={{ width: 100, height: 100, borderRadius: "50%", background: "linear-gradient(135deg, #f5ebe3 0%, #e8d5c8 100%)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, border: "3px solid #8b225220", position: "relative" }}>
                <div style={{ width: 120, height: 120, borderRadius: "50%", border: "2px solid #8b225015", position: "absolute", top: -13, left: -13 }} />
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#8b2252" opacity="0.6" /></svg>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#8b2252", marginBottom: 4 }}>{archetype}</div>
              <div style={{ fontSize: 14, color: "#6b5449" }}>{displayName || "神秘飞行员"}</div>
            </div>
            <div style={{ padding: "0 28px", flex: 1 }}>
              <div style={{ background: "#ffffff", borderRadius: 16, padding: "20px 20px", border: "1px solid #e8d5c8" }}>
                {bars.map((bar, i) => (
                  <div key={i} style={{ marginBottom: i < bars.length - 1 ? 20 : 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, marginBottom: 8, color: "#2d1b14" }}>
                      <span>{bar.left}</span><span>{bar.right}</span>
                    </div>
                    <div style={{ height: 10, background: "#f5ebe3", borderRadius: 5, position: "relative" }}>
                      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${bar.pct}%`, background: "linear-gradient(90deg, #c4536a40 0%, #8b225060 100%)", borderRadius: 5 }} />
                      <div style={{ position: "absolute", left: `${bar.pct}%`, top: "50%", transform: "translate(-50%, -50%)", width: 16, height: 16, background: "#8b2252", borderRadius: "50%", boxShadow: "0 1px 4px rgba(139,34,82,0.35)" }} />
                    </div>
                    <div style={{ textAlign: "center", color: "#8b2252", fontWeight: 500, fontSize: 11, marginTop: 6 }}>{bar.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "linear-gradient(135deg, #8b2252 0%, #5a2d3e 100%)", color: "#fdf6f0", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
              <div style={{ maxWidth: 200 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>了解你的关系基因</div>
                <div style={{ fontSize: 11, color: "#fdf6f0bb", lineHeight: 1.5 }}>扫码参与测试，看看<br />我们到底有多契合？</div>
              </div>
              <div style={{ width: 80, height: 80, background: "#ffffff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 6 }}>
                <QRCodeSVG value={shareUrl} size={68} level="H" bgColor="#ffffff" fgColor="#8b2252" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PosterImageOverlay({ src, onClose }: { src: string | null; onClose: () => void }) {
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="text-white/80 mb-4 flex flex-col items-center">
        <p className="text-lg font-medium">长按下方图片保存到手机</p>
      </div>
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="专属海报" className="w-full h-auto" />
      </div>
      <button onClick={onClose} className="mt-8 px-6 py-2.5 rounded-full bg-white/10 text-white font-medium hover:bg-white/20 transition-colors">
        关闭
      </button>
    </div>
  );
}
