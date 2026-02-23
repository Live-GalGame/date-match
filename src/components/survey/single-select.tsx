"use client";

import { cn } from "@/lib/utils";

interface SingleSelectProps {
  question: string;
  note?: string;
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (value: string) => void;
}

export function SingleSelect({
  question,
  note,
  options,
  value,
  onChange,
}: SingleSelectProps) {
  return (
    <div className="py-6">
      <p className="font-serif text-lg mb-1">{question}</p>
      {note && (
        <p className="text-xs text-muted-foreground mb-3 italic">{note}</p>
      )}
      <div className="flex flex-col gap-2 mt-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "w-full px-4 py-3 rounded-xl text-sm text-left transition-all duration-200",
              value === option.value
                ? "bg-primary/10 text-foreground ring-2 ring-primary/40 font-medium"
                : "bg-muted text-muted-foreground hover:bg-border"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
