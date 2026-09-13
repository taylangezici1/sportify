"use client";

import Link from "next/link";
import { useRef } from "react";
import { youtubeVideoId } from "@repo/ui";
import { usePlayer, useStageSlot, type QueueItem } from "@/context/PlayerContext";
import { formatTime } from "@/lib/format";
import { IconFlame, IconMusic, IconScissors, IconSnowflake } from "@/components/ui/Icons";
import { Badge, EmptyState, Button, Thumb } from "@/components/ui/primitives";
import ModeSwitch from "@/components/layout/ModeSwitch";
import ProgressBar from "./ProgressBar";
import TransportControls from "./TransportControls";
import VolumeControl from "./VolumeControl";

function itemTitle(item: QueueItem) {
  return item.kind === "clip" ? item.clip.trackName : item.track.title;
}
function itemArtist(item: QueueItem) {
  return item.kind === "clip" ? (item.clip.artist ?? "") : item.track.artist;
}
function itemImage(item: QueueItem) {
  const uri = item.kind === "clip" ? item.clip.trackUri : item.track.uri;
  const id = youtubeVideoId(uri);
  return item.kind === "clip" ? (item.clip.imageUrl ?? (id && `https://i.ytimg.com/vi/${id}/mqdefault.jpg`)) : item.track.imageUrl;
}

export default function NowPlaying() {
  const { isActive, currentTrack, activeClip, position, duration, seek, mode, queue, queueIndex, playQueueIndex } =
    usePlayer();
  const heroRef = useRef<HTMLDivElement>(null);
  useStageSlot(heroRef, { interactive: true, enabled: isActive });

  if (!isActive || !currentTrack) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <EmptyState
          icon={<IconMusic size={40} />}
          title="Nothing playing"
          description="Start a workout with your clips, chill with a playlist, or pick a track from search."
          action={
            <div className="flex flex-col items-center gap-4">
              <ModeSwitch />
              <Link href="/search" className="text-sm text-muted underline-offset-4 hover:underline">
                Go to search
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  const rangeStart = activeClip?.startTime ?? 0;
  const rangeEnd = activeClip?.endTime ?? (duration || currentTrack.durationMs || 1);
  const fill = mode === "workout" ? "bg-workout" : "bg-chill";
  const upNext = queue.slice(queueIndex + 1, queueIndex + 26);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-4 md:px-8 md:pt-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section>
          <div
            ref={heroRef}
            className="aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10"
          />

          <div className="mt-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                {mode === "workout" ? (
                  <Badge tone="workout">
                    <IconFlame size={11} /> Workout
                  </Badge>
                ) : (
                  <Badge tone="chill">
                    <IconSnowflake size={11} /> Chill
                  </Badge>
                )}
                {activeClip && (
                  <Badge>
                    <IconScissors size={11} /> {formatTime(activeClip.startTime)} – {formatTime(activeClip.endTime)}
                  </Badge>
                )}
              </div>
              <h1 className="line-clamp-2 text-xl font-black leading-tight md:text-2xl">{currentTrack.title}</h1>
              <p className="mt-0.5 truncate text-sm text-muted">{currentTrack.artist || "YouTube"}</p>
            </div>
          </div>

          <div className="mt-5">
            <ProgressBar
              position={position}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              onSeek={seek}
              fillClass={fill}
              showTimes
            />
          </div>

          <div className="mt-4 flex flex-col items-center gap-5">
            <TransportControls size="lg" />
            <div className="flex w-full flex-wrap items-center justify-center gap-4 md:justify-between">
              <ModeSwitch compact />
              <VolumeControl className="hidden md:flex" />
            </div>
          </div>
        </section>

        <aside className="min-w-0">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Up next</h2>
            <span className="text-xs text-subtle">
              {queueIndex + 1} / {queue.length}
            </span>
          </div>
          {upNext.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">
              End of queue. It loops back to the start.
            </p>
          ) : (
            <ol className="flex flex-col gap-1">
              {upNext.map((item, i) => {
                const index = queueIndex + 1 + i;
                return (
                  <li key={`${index}-${itemTitle(item)}`}>
                    <button
                      type="button"
                      onClick={() => playQueueIndex(index)}
                      className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-surface-2"
                    >
                      <Thumb src={itemImage(item)} alt="" className="aspect-video h-10" rounded="rounded-md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{itemTitle(item)}</p>
                        <p className="truncate text-xs text-muted">
                          {item.kind === "clip"
                            ? `${formatTime(item.clip.startTime)} – ${formatTime(item.clip.endTime)}`
                            : itemArtist(item)}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
          {queue.length > 26 && (
            <p className="mt-2 text-center text-xs text-subtle">and {queue.length - 26 - queueIndex} more</p>
          )}
          <div className="mt-6 md:hidden">
            <Button variant="ghost" onClick={() => history.back()} className="w-full">
              Back
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
