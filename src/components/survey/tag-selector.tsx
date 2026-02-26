"use client";

import { cn } from "@/lib/utils";

interface TagSelectorProps {
  question: string;
  note?: string;
  options: string[];
  selected: string[];
  maxSelect: number;
  onChange: (selected: string[]) => void;
}

export function TagSelector({
  question,
  note,
  options,
  selected,
  maxSelect,
  onChange,
}: TagSelectorProps) {
  function toggle(option: string) {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else if (selected.length < maxSelect) {
      onChange([...selected, option]);
    }
  }

  const isUnlimited = maxSelect >= options.length;

  return (
    <div className="py-6">
      <p className="font-serif text-lg mb-1">{question}</p>
      {note && (
        <p className="text-xs text-muted-foreground mb-2 italic whitespace-pre-line">{note}</p>
      )}
      {!isUnlimited && (
        <p className="text-sm text-muted-foreground mb-4">
          最多选择 {maxSelect} 项
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          const isDisabled = !isSelected && selected.length >= maxSelect;
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              disabled={isDisabled}
              className={cn(
                "px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : isDisabled
                    ? "bg-muted/50 text-muted-foreground/40 cursor-not-allowed"
                    : "bg-muted text-muted-foreground hover:bg-border hover:shadow-sm"
              )}
            >
              {isSelected && <span className="inline-block mr-1.5">✓</span>}
              {option}
            </button>
          );
        })}
      </div>
      {!isUnlimited && (
        <p className="text-xs text-muted-foreground mt-3">
          已选 {selected.length}/{maxSelect}
        </p>
      )}
    </div>
  );
}
