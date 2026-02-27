"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface EmojiCardOption {
  value: string;
  label: string;
  emoji?: string;
  image?: string;
}

interface EmojiCardSelectProps {
  question: string;
  note?: string;
  options: EmojiCardOption[];
  value: string | null;
  onChange: (value: string) => void;
}

export function EmojiCardSelect({
  question,
  note,
  options,
  value,
  onChange,
}: EmojiCardSelectProps) {
  const hasImages = options.some((o) => o.image);

  return (
    <div className="py-4">
      <h2 className="font-serif text-2xl sm:text-3xl text-center mb-2 leading-tight">
        {question}
      </h2>
      {note && (
        <p className="text-xs text-muted-foreground text-center mb-6 italic whitespace-pre-line">
          {note}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 mt-6">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-col items-center rounded-2xl border-2 transition-all duration-200 overflow-hidden",
              "hover:scale-[1.02] hover:shadow-md active:scale-[0.98]",
              hasImages ? "gap-0" : "gap-2 p-5",
              value === option.value
                ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20"
                : "border-border bg-card hover:border-primary/30"
            )}
          >
            {option.image ? (
              <>
                <Image
                  src={option.image}
                  alt={option.label}
                  width={200}
                  height={200}
                  className="w-full aspect-square object-cover"
                />
                <span className="text-xs sm:text-sm text-center font-medium leading-snug px-2 py-2.5">
                  {option.label}
                </span>
              </>
            ) : (
              <>
                {option.emoji && (
                  <span className="text-4xl leading-none">{option.emoji}</span>
                )}
                <span className="text-sm text-center font-medium leading-snug">
                  {option.label}
                </span>
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
