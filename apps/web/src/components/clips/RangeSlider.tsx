"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { clamp, formatTime } from "@/lib/format";

interface RangeSliderProps {
  duration: number;
  start: number;
  end: number;
  /** Current playhead, drawn as a marker. */
  position?: number;
  minGap?: number;
  onChange: (start: number, end: number) => void;
  /** Fired when a drag ends, with which handle moved. */
  onCommit?: (start: number, end: number, handle: "start" | "end") => void;
}

const MIN_GAP_DEFAULT = 1000;

/** Two-thumb range selector with touch, mouse and keyboard support. */
export default function RangeSlider({
  duration,
  start,
  end,
  position,
  minGap = MIN_GAP_DEFAULT,
  onChange,
  onCommit,
}: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<"start" | "end" | null>(null);
  const safeDuration = Math.max(1, duration);
  const pct = (ms: number) => clamp((ms / safeDuration) * 100, 0, 100);

  const toMs = (clientX: number) => {
    const rect = trackRef.current!.getBoundingClientRect();
    return clamp(((clientX - rect.left) / Math.max(1, rect.width)) * safeDuration, 0, safeDuration);
  };

  const move = (handle: "start" | "end", ms: number) => {
    if (handle === "start") onChange(clamp(Math.round(ms), 0, end - minGap), end);
    else onChange(start, clamp(Math.round(ms), start + minGap, safeDuration));
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const ms = toMs(e.clientX);
    // Grab whichever handle is closer; ties go to the one on the "correct" side.
    const handle: "start" | "end" =
      Math.abs(ms - start) < Math.abs(ms - end) ? "start" : Math.abs(ms - start) > Math.abs(ms - end) ? "end" : ms < start ? "start" : "end";
    setActive(handle);
    e.currentTarget.setPointerCapture(e.pointerId);
    move(handle, ms);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!active) return;
    move(active, toMs(e.clientX));
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!active) return;
    const ms = toMs(e.clientX);
    const handle = active;
    setActive(null);
    const nextStart = handle === "start" ? clamp(Math.round(ms), 0, end - minGap) : start;
    const nextEnd = handle === "end" ? clamp(Math.round(ms), start + minGap, safeDuration) : end;
    onChange(nextStart, nextEnd);
    onCommit?.(nextStart, nextEnd, handle);
  };

  const onKey = (handle: "start" | "end") => (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10_000 : 1000;
    let delta = 0;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") delta = step;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") delta = -step;
    if (!delta) return;
    e.preventDefault();
    const value = (handle === "start" ? start : end) + delta;
    move(handle, value);
    const ns = handle === "start" ? clamp(value, 0, end - minGap) : start;
    const ne = handle === "end" ? clamp(value, start + minGap, safeDuration) : end;
    onCommit?.(ns, ne, handle);
  };

  const thumb = (handle: "start" | "end") => {
    const value = handle === "start" ? start : end;
    return (
      <div
        role="slider"
        tabIndex={0}
        aria-label={handle === "start" ? "Clip start" : "Clip end"}
        aria-valuemin={0}
        aria-valuemax={safeDuration}
        aria-valuenow={value}
        aria-valuetext={formatTime(value)}
        onKeyDown={onKey(handle)}
        className={`absolute top-1/2 z-10 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-bg bg-text shadow-lg transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
          active === handle ? "scale-125" : "hover:scale-110"
        }`}
        style={{ left: `${pct(value)}%` }}
      />
    );
  };

  return (
    <div className="select-none">
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setActive(null)}
        className="relative h-10 w-full cursor-pointer touch-none"
      >
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/10" />
        <div
          className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-brand"
          style={{ left: `${pct(start)}%`, width: `${pct(end) - pct(start)}%` }}
        />
        {position !== undefined && (
          <div
            className="pointer-events-none absolute top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded bg-white/80"
            style={{ left: `${pct(position)}%` }}
          />
        )}
        {thumb("start")}
        {thumb("end")}
      </div>
      <div className="flex justify-between font-mono text-[11px] tabular-nums text-subtle">
        <span>0:00</span>
        <span>{formatTime(safeDuration)}</span>
      </div>
    </div>
  );
}
