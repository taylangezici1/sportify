"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { clamp, formatTime } from "@/lib/format";

interface ProgressBarProps {
  position: number;
  /** Lower bound of the visible window (clip start), default 0. */
  rangeStart?: number;
  /** Upper bound of the visible window (clip end or track duration). */
  rangeEnd: number;
  onSeek?: (ms: number) => void;
  /** Tailwind color class for the fill. */
  fillClass?: string;
  showTimes?: boolean;
  thin?: boolean;
  className?: string;
}

/** Seekable progress bar that can be scoped to a clip window. */
export default function ProgressBar({
  position,
  rangeStart = 0,
  rangeEnd,
  onSeek,
  fillClass = "bg-text",
  showTimes = false,
  thin = false,
  className = "",
}: ProgressBarProps) {
  const [drag, setDrag] = useState<number | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const span = Math.max(1, rangeEnd - rangeStart);
  const shown = drag ?? position;
  const pct = clamp(((shown - rangeStart) / span) * 100, 0, 100);

  const toMs = (clientX: number) => {
    const rect = barRef.current!.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
    return rangeStart + ratio * span;
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!onSeek) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag(toMs(e.clientX));
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (drag === null) return;
    setDrag(toMs(e.clientX));
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (drag === null) return;
    const ms = toMs(e.clientX);
    setDrag(null);
    onSeek?.(ms);
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        ref={barRef}
        role={onSeek ? "slider" : "progressbar"}
        aria-label="Position"
        aria-valuemin={rangeStart}
        aria-valuemax={rangeEnd}
        aria-valuenow={Math.round(shown)}
        aria-valuetext={formatTime(shown)}
        tabIndex={onSeek ? 0 : -1}
        onKeyDown={(e) => {
          if (!onSeek) return;
          if (e.key === "ArrowRight") onSeek(clamp(position + 5000, rangeStart, rangeEnd));
          if (e.key === "ArrowLeft") onSeek(clamp(position - 5000, rangeStart, rangeEnd));
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setDrag(null)}
        className={`group relative w-full touch-none select-none ${onSeek ? "cursor-pointer" : ""} ${thin ? "py-0" : "py-2"}`}
      >
        <div className={`relative w-full overflow-hidden rounded-full bg-white/15 ${thin ? "h-1" : "h-1.5 group-hover:h-2"} transition-all`}>
          <div className={`absolute inset-y-0 left-0 rounded-full ${fillClass}`} style={{ width: `${pct}%` }} />
        </div>
        {onSeek && !thin && (
          <div
            className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-text shadow transition-opacity ${
              drag !== null ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
            style={{ left: `${pct}%` }}
          />
        )}
      </div>
      {showTimes && (
        <div className="mt-1 flex justify-between font-mono text-[11px] tabular-nums text-muted">
          <span>{formatTime(shown - rangeStart)}</span>
          <span>{formatTime(span)}</span>
        </div>
      )}
    </div>
  );
}
