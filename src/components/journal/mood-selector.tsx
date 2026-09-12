"use client";

import { cn } from "@/lib/utils";

interface MoodSelectorProps {
  value: number;
  onChange: (mood: number) => void;
}

const moods = [
  { value: 1, emoji: "😫", label: "Terrible" },
  { value: 2, emoji: "😟", label: "Bad" },
  { value: 3, emoji: "😐", label: "Neutral" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
];

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
      {moods.map((mood) => (
        <button
          key={mood.value}
          type="button"
          onClick={() => onChange(mood.value)}
          className={cn(
            "flex flex-col items-center justify-center p-2 rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === mood.value 
              ? "bg-primary/10 ring-2 ring-primary scale-110" 
              : "hover:bg-muted opacity-70 hover:opacity-100"
          )}
          aria-pressed={value === mood.value}
          aria-label={`Select mood: ${mood.label}`}
        >
          <span className="text-3xl mb-1">{mood.emoji}</span>
          <span className="text-xs font-medium text-muted-foreground">{mood.label}</span>
        </button>
      ))}
    </div>
  );
}
