"use client";

import { usePlayer } from "@/context/PlayerContext";
import { IconLoader, IconNext, IconPause, IconPlay, IconPrev, IconShuffle } from "@/components/ui/Icons";
import { IconButton } from "@/components/ui/primitives";

export default function TransportControls({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const { isPlaying, buffering, togglePlay, next, previous, isShuffle, toggleShuffle, queue, isActive } = usePlayer();
  const canSkip = queue.length > 1;
  const dims = size === "lg" ? { main: 72, icon: 32, side: 48, sideIcon: 26 } : size === "sm" ? { main: 36, icon: 18, side: 32, sideIcon: 18 } : { main: 48, icon: 22, side: 40, sideIcon: 22 };

  return (
    <div className={`flex items-center ${size === "lg" ? "gap-4 md:gap-6" : "gap-1 md:gap-2"}`}>
      {size !== "sm" && (
        <IconButton label="Shuffle" size={dims.side} active={isShuffle} onClick={toggleShuffle} disabled={!canSkip}>
          <IconShuffle size={dims.sideIcon - 4} className={isShuffle ? "text-brand" : undefined} />
        </IconButton>
      )}
      <IconButton label="Previous" size={dims.side} onClick={previous} disabled={!isActive}>
        <IconPrev size={dims.sideIcon} />
      </IconButton>
      <button
        type="button"
        onClick={togglePlay}
        disabled={!isActive}
        aria-label={isPlaying ? "Pause" : "Play"}
        style={{ width: dims.main, height: dims.main }}
        className="inline-flex items-center justify-center rounded-full bg-text text-bg shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
      >
        {buffering && isPlaying ? (
          <IconLoader size={dims.icon} />
        ) : isPlaying ? (
          <IconPause size={dims.icon} />
        ) : (
          <IconPlay size={dims.icon} className="translate-x-[6%]" />
        )}
      </button>
      <IconButton label="Next" size={dims.side} onClick={next} disabled={!isActive}>
        <IconNext size={dims.sideIcon} />
      </IconButton>
      {size === "lg" && <div style={{ width: dims.side }} />}
    </div>
  );
}
