"use client";

import { useEffect, useState } from "react";

function getNextSunday8pm(): Date {
  const now = new Date();
  const beijing = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Shanghai" }));
  const utcOffset = now.getTime() - beijing.getTime();

  const target = new Date(beijing);
  target.setHours(20, 0, 0, 0);

  const day = beijing.getDay();
  let daysUntilSunday = (7 - day) % 7;
  if (daysUntilSunday === 0 && beijing >= target) {
    daysUntilSunday = 7;
  }
  target.setDate(target.getDate() + daysUntilSunday);

  return new Date(target.getTime() + utcOffset);
}

function getTimeLeft(target: Date) {
  const diff = Math.max(0, target.getTime() - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-xl border flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}>
        <span className="text-2xl sm:text-3xl font-mono font-semibold tabular-nums" style={{ color: "rgba(255,255,255,1)" }}>
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[11px] sm:text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.8)" }}>{label}</span>
    </div>
  );
}

export function CountdownTimer({ participantCount }: { participantCount: number }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(getNextSunday8pm()));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const target = getNextSunday8pm();
    setTimeLeft(getTimeLeft(target));

    const id = setInterval(() => {
      const left = getTimeLeft(target);
      setTimeLeft(left);
      if (left.days + left.hours + left.minutes + left.seconds === 0) {
        clearInterval(id);
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  if (!mounted) {
    return <div className="h-[120px] sm:h-[140px]" />;
  }

  return (
    <div className="flex flex-col items-center gap-4 animate-fade-in" style={{ animationDelay: "200ms" }}>
      <p className="text-xs sm:text-sm tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.8)" }}>
        距下次匹配
      </p>
      <div className="flex items-center gap-2.5 sm:gap-4">
        <TimeBlock value={timeLeft.days} label="天" />
        <span className="text-xl -mt-4" style={{ color: "rgba(255,255,255,0.6)" }}>:</span>
        <TimeBlock value={timeLeft.hours} label="时" />
        <span className="text-xl -mt-4" style={{ color: "rgba(255,255,255,0.6)" }}>:</span>
        <TimeBlock value={timeLeft.minutes} label="分" />
        <span className="text-xl -mt-4" style={{ color: "rgba(255,255,255,0.6)" }}>:</span>
        <TimeBlock value={timeLeft.seconds} label="秒" />
      </div>
      {participantCount > 0 && (
        <div className="flex items-center gap-1.5 mt-2 text-xs sm:text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
          <span>已有</span>
          <span className="font-medium px-2 py-0.5 rounded-full" style={{ 
            backgroundColor: "rgba(255,255,255,0.12)", 
            color: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(255,255,255,0.2)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)"
          }}>
            {participantCount}+
          </span>
          <span>人完成测试</span>
        </div>
      )}
    </div>
  );
}
