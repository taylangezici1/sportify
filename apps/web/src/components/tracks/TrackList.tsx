"use client";

import type { Track } from "@repo/ui";
import { usePlayer } from "@/context/PlayerContext";
import { formatTime } from "@/lib/format";
import { IconPause, IconPlay, IconScissors } from "@/components/ui/Icons";
import { Button, Thumb } from "@/components/ui/primitives";

interface TrackListProps {
  tracks: Track[];
  onClip: (track: Track) => void;
  /** When set, playing a row queues the whole list from that row. */
  queueAll?: boolean;
  numbered?: boolean;
}

export default function TrackList({ tracks, onClip, queueAll = false, numbered = false }: TrackListProps) {
  const { playTrack, playTracks, currentTrack, isPlaying, togglePlay, activeClip } = usePlayer();

  const play = (track: Track, index: number) => {
    if (currentTrack?.uri === track.uri && !activeClip) {
      togglePlay();
      return;
    }
    if (queueAll) playTracks(tracks, { startIndex: index });
    else playTrack(track);
  };

  return (
    <ul className="flex flex-col gap-0.5">
      {tracks.map((track, i) => {
        const current = currentTrack?.uri === track.uri && !activeClip;
        return (
          <li key={`${track.uri}-${i}`}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => play(track, i)}
              onKeyDown={(e) => e.key === "Enter" && play(track, i)}
              className={`group flex cursor-pointer items-center gap-3 rounded-xl p-2 pr-2 transition-colors ${
                current ? "bg-surface-3" : "hover:bg-surface-2"
              }`}
            >
              {numbered && (
                <span className="hidden w-6 shrink-0 text-center font-mono text-xs tabular-nums text-subtle sm:block">
                  {i + 1}
                </span>
              )}
              <div className="relative">
                <Thumb src={track.imageUrl} alt="" className="aspect-video h-12 md:h-14" rounded="rounded-lg" />
                <div
                  className={`absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 text-white transition-opacity ${
                    current ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  {current && isPlaying ? <IconPause size={20} /> : <IconPlay size={20} />}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className={`truncate font-semibold ${current ? "text-chill" : ""}`}>{track.title}</p>
                <p className="truncate text-xs text-muted">{track.artist || "YouTube"}</p>
              </div>
              <span className="hidden w-12 shrink-0 text-right font-mono text-xs tabular-nums text-muted sm:block">
                {track.durationMs ? formatTime(track.durationMs) : ""}
              </span>
              <Button
                size="sm"
                variant="secondary"
                icon={<IconScissors size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onClip(track);
                }}
                className="shrink-0"
              >
                Clip
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
