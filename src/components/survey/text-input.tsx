"use client";

interface TextInputProps {
  question: string;
  note?: string;
  placeholder?: string;
  multiline?: boolean;
  value: string;
  onChange: (value: string) => void;
}

export function TextInput({
  question,
  note,
  placeholder,
  multiline,
  value,
  onChange,
}: TextInputProps) {
  const baseClasses =
    "w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all";

  return (
    <div className="py-6">
      <p className="font-serif text-lg mb-1">{question}</p>
      {note && (
        <p className="text-xs text-muted-foreground mb-3 italic">{note}</p>
      )}

      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${baseClasses} resize-none`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseClasses}
        />
      )}
    </div>
  );
}
