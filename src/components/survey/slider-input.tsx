"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface SliderInputProps {
  question: string;
  note?: string;
  min: number;
  max: number;
  step?: number;
  minLabel: string;
  maxLabel: string;
  unit?: string;
  value: number | null;
  onChange: (value: number) => void;
}

export function SliderInput({
  question,
  note,
  min,
  max,
  step = 1,
  minLabel,
  maxLabel,
  unit,
  value,
  onChange,
}: SliderInputProps) {
  const defaultValue = Math.round((min + max) / 2);
  const current = value ?? defaultValue;
  const percentage = ((current - min) / (max - min)) * 100;

  useEffect(() => {
    if (value === null) {
      onChange(defaultValue);
    }
  }, [value, onChange, defaultValue]);

  return (
    <div className="py-6">
      <p className="font-serif text-lg mb-1">{question}</p>
      {note && (
        <p className="text-xs text-muted-foreground mb-4 italic whitespace-pre-line">{note}</p>
      )}

      <div className="flex items-center justify-center mb-3">
        <span
          className={cn(
            "inline-flex items-baseline gap-1 tabular-nums",
            "text-3xl font-bold text-primary transition-all"
          )}
        >
          {current}
          {unit && <span className="text-base font-normal text-muted-foreground">{unit}</span>}
        </span>
      </div>

      <div className="relative px-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={current}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer
            bg-muted
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-6
            [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-primary
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:shadow-primary/30
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:w-6
            [&::-moz-range-thumb]:h-6
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-primary
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:shadow-lg"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${percentage}%, hsl(var(--muted)) ${percentage}%, hsl(var(--muted)) 100%)`,
          }}
        />
      </div>

      <div className="flex justify-between text-xs sm:text-sm text-muted-foreground mt-2 px-1">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}
