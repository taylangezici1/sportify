"use client";

import { IconFlame, IconLoader, IconSnowflake } from "@/components/ui/Icons";
import { useModeActions } from "./useModeActions";

/** Segmented Workout / Chill control. Tapping a mode starts it. */
export default function ModeSwitch({ compact = false }: { compact?: boolean }) {
  const { mode, start, starting } = useModeActions();

  const item = (target: "workout" | "chill", label: string, Icon: typeof IconFlame) => {
    const active = mode === target;
    const color = target === "workout" ? "bg-workout text-black" : "bg-chill text-black";
    return (
      <button
        type="button"
        onClick={() => start(target)}
        aria-pressed={active}
        title={`Start ${label.toLowerCase()} mode`}
        className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full font-bold transition-all ${
          compact ? "h-8 px-2 text-[11px]" : "h-10 px-2 text-[11px]"
        } ${active ? `${color} shadow-lg` : "text-muted hover:text-text"}`}
      >
        {starting === target ? <IconLoader size={compact ? 14 : 16} /> : <Icon size={compact ? 14 : 16} />}
        {!compact || active ? <span className="truncate uppercase tracking-wide">{label}</span> : null}
      </button>
    );
  };

  return (
    <div
      role="group"
      aria-label="Playback mode"
      className={`flex items-center gap-1 rounded-full bg-surface-3/70 p-1 ${compact ? "" : "w-full"}`}
    >
      {item("workout", "Workout", IconFlame)}
      {item("chill", "Chill", IconSnowflake)}
    </div>
  );
}
