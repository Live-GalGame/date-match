"use client";

import { cn } from "@/lib/utils";

interface RankingSelectorProps {
  question: string;
  note?: string;
  options: string[];
  selectCount: number;
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function RankingSelector({
  question,
  note,
  options,
  selectCount,
  selected,
  onChange,
}: RankingSelectorProps) {
  const isAll = selectCount >= options.length;

  function toggle(option: string) {
    const idx = selected.indexOf(option);
    if (idx >= 0) {
      onChange(selected.filter((s) => s !== option));
    } else if (selected.length < selectCount) {
      onChange([...selected, option]);
    }
  }

  return (
    <div className="py-6">
      <p className="font-serif text-lg mb-1">{question}</p>
      {note && (
        <p className="text-xs text-muted-foreground mb-2 italic">{note}</p>
      )}
      <p className="text-sm text-muted-foreground mb-4">
        {isAll
          ? "按重要性依次点击排列（先点击 = 最重要）"
          : `请依次点击选择${selectCount}项（先点击 = 最不能接受）`}
      </p>

      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const rank = selected.indexOf(option);
          const isSelected = rank >= 0;
          const isFull = selected.length >= selectCount;
          const isDisabled = !isSelected && isFull;

          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              disabled={isDisabled}
              className={cn(
                "relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all duration-200",
                isSelected
                  ? "bg-primary/10 text-foreground ring-2 ring-primary/40"
                  : isDisabled
                    ? "bg-muted/50 text-muted-foreground/40 cursor-not-allowed"
                    : "bg-muted text-muted-foreground hover:bg-border hover:shadow-sm"
              )}
            >
              <span
                className={cn(
                  "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-background border border-border text-muted-foreground"
                )}
              >
                {isSelected ? rank + 1 : "·"}
              </span>
              <span className={cn("flex-1", isSelected && "font-medium")}>{option}</span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        已选 {selected.length}/{selectCount}
      </p>
    </div>
  );
}
