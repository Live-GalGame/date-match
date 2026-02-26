"use client";

import { useEffect, useState } from "react";

function getNextTuesday9pm(): Date {
  const now = new Date();
  const beijing = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Shanghai" }));
  const utcOffset = now.getTime() - beijing.getTime();

  const target = new Date(beijing);
  target.setHours(21, 0, 0, 0);

  const day = beijing.getDay();
  // 周二 = 2
  let daysUntilTuesday = (2 - day + 7) % 7;
  if (daysUntilTuesday === 0 && beijing >= target) {
    daysUntilTuesday = 7;
  }
  target.setDate(target.getDate() + daysUntilTuesday);

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
      <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center">
        <span className="text-2xl sm:text-3xl font-mono font-semibold tabular-nums">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[11px] sm:text-xs text-white/50 mt-1.5">{label}</span>
    </div>
  );
}

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(getNextTuesday9pm()));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const target = getNextTuesday9pm();
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
      <p className="text-xs sm:text-sm tracking-widest uppercase text-white/50">
        距下次匹配
      </p>
      <div className="flex items-center gap-2.5 sm:gap-4">
        <TimeBlock value={timeLeft.days} label="天" />
        <span className="text-xl text-white/30 -mt-4">:</span>
        <TimeBlock value={timeLeft.hours} label="时" />
        <span className="text-xl text-white/30 -mt-4">:</span>
        <TimeBlock value={timeLeft.minutes} label="分" />
        <span className="text-xl text-white/30 -mt-4">:</span>
        <TimeBlock value={timeLeft.seconds} label="秒" />
      </div>
    </div>
  );
}
