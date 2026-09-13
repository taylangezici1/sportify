"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { usePlayer, useStageSlot } from "@/context/PlayerContext";
import { IconFlame, IconSnowflake } from "@/components/ui/Icons";
import ModeSwitch from "@/components/layout/ModeSwitch";
import ProgressBar from "./ProgressBar";
import TransportControls from "./TransportControls";
import VolumeControl from "./VolumeControl";

export default function MiniPlayer() {
  const { isActive, currentTrack, activeClip, position, duration, seek, mode } = usePlayer();
  const router = useRouter();
  const slotRef = useRef<HTMLDivElement>(null);
  useStageSlot(slotRef, { enabled: isActive });

  if (!isActive || !currentTrack) return null;

  const rangeStart = activeClip?.startTime ?? 0;
  const rangeEnd = activeClip?.endTime ?? (duration || currentTrack.durationMs || 1);
  const fill = mode === "workout" ? "bg-workout" : "bg-chill";

  return (
    <div className="relative z-30 shrink-0 border-t border-line bg-surface">
      <div className="absolute inset-x-0 top-0 -translate-y-1/2 px-0 md:hidden">
        <ProgressBar position={position} rangeStart={rangeStart} rangeEnd={rangeEnd} fillClass={fill} thin />
      </div>

      <div className="flex h-16 items-center gap-3 px-3 md:h-20 md:px-4">
        {/* Left: video thumbnail (the live iframe is drawn over this slot) + title */}
        <button
          type="button"
          onClick={() => router.push("/player")}
          className="flex min-w-0 flex-1 items-center gap-3 text-left md:w-1/3 md:flex-none"
          aria-label="Open now playing"
        >
          <div ref={slotRef} className="aspect-video h-11 shrink-0 overflow-hidden rounded-md bg-surface-3 md:h-14" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{currentTrack.title}</p>
            <p className="flex items-center gap-1.5 truncate text-xs text-muted">
              {mode === "workout" ? (
                <IconFlame size={12} className="shrink-0 text-workout" />
              ) : (
                <IconSnowflake size={12} className="shrink-0 text-chill" />
              )}
              <span className="truncate">{currentTrack.artist || "YouTube"}</span>
            </p>
          </div>
        </button>

        {/* Center: transport (+ progress on desktop) */}
        <div className="flex flex-col items-center md:flex-1">
          <TransportControls size="sm" />
          <div className="hidden w-full max-w-xl items-center gap-2 md:flex">
            <ProgressBar
              position={position}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              onSeek={seek}
              fillClass={fill}
              showTimes
            />
          </div>
        </div>

        {/* Right: mode + volume on desktop */}
        <div className="hidden items-center justify-end gap-3 md:flex md:w-1/3">
          <ModeSwitch compact />
          <VolumeControl />
        </div>
      </div>
    </div>
  );
}
