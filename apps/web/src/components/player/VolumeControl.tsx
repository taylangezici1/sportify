"use client";

import { usePlayer } from "@/context/PlayerContext";
import { IconMute, IconVolume, IconVolumeLow } from "@/components/ui/Icons";
import { IconButton } from "@/components/ui/primitives";

export default function VolumeControl({ className = "" }: { className?: string }) {
  const { volume, muted, setVolume, toggleMute } = usePlayer();
  const effective = muted ? 0 : volume;
  const Icon = effective === 0 ? IconMute : effective < 50 ? IconVolumeLow : IconVolume;

  return (
    <div className={`group flex items-center gap-1 ${className}`}>
      <IconButton label={muted ? "Unmute" : "Mute"} size={36} onClick={toggleMute}>
        <Icon size={18} />
      </IconButton>
      <div className="relative h-8 w-24">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-text group-hover:bg-brand" style={{ width: `${effective}%` }} />
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={effective}
          aria-label="Volume"
          onChange={(e) => setVolume(Number(e.target.value))}
          className="sr-range absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  );
}
