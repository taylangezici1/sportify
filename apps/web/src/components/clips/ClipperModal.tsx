"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import type { Clip, Track } from "@repo/ui";
import { usePlayer, useStageSlot } from "@/context/PlayerContext";
import { api, ApiError } from "@/lib/client-api";
import { clamp, formatTime, formatTimePrecise } from "@/lib/format";
import { IconPause, IconPlay, IconX, IconLoader } from "@/components/ui/Icons";
import { Button, IconButton } from "@/components/ui/primitives";
import RangeSlider from "./RangeSlider";

interface ClipperModalProps {
  track: Track;
  /** Existing clip to edit; when omitted a new clip is created. */
  clip?: Clip;
  /** Pre-filled window, e.g. when recreating a legacy clip. */
  initialRange?: { start: number; end: number };
  onClose: () => void;
  onSaved?: (clip: Clip, wasEdit: boolean) => void;
}

const MIN_GAP = 1000;
const DEFAULT_LEN = 30_000;

export default function ClipperModal({ track, clip, initialRange, onClose, onSaved }: ClipperModalProps) {
  const { playTrack, setPreviewRange, position, duration, isPlaying, togglePlay, seek, pause, currentTrack } =
    usePlayer();
  const total = track.durationMs || duration || 0;

  const [range, setRange] = useState(() => {
    const seed = clip ? { start: clip.startTime, end: clip.endTime } : initialRange;
    const start = seed?.start ?? 0;
    const end = seed?.end ?? Math.min(total || DEFAULT_LEN, start + DEFAULT_LEN);
    return { start, end: Math.max(end, start + MIN_GAP) };
  });
  const [saving, setSaving] = useState(false);
  const slotRef = useRef<HTMLDivElement>(null);
  // z-index above the modal backdrop (z-50) so the video shows inside the dialog.
  useStageSlot(slotRef, { zIndex: 60 });

  // Start playback at the clip start and keep the player looping the window.
  useEffect(() => {
    playTrack(track, { startMs: range.start });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per opened track
  }, [track.uri]);

  useEffect(() => {
    setPreviewRange(range);
  }, [range, setPreviewRange]);

  useEffect(() => {
    return () => {
      setPreviewRange(null);
      pause();
    };
  }, [setPreviewRange, pause]);

  // Once the real duration is known, make sure the end stays in bounds.
  useEffect(() => {
    if (total > 0 && range.end > total) setRange((r) => ({ start: Math.min(r.start, total - MIN_GAP), end: total }));
  }, [total, range.end]);

  // Escape closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const update = useCallback(
    (start: number, end: number) => {
      const s = clamp(start, 0, Math.max(0, (total || Infinity) - MIN_GAP));
      const e = clamp(end, s + MIN_GAP, total || Infinity);
      setRange({ start: s, end: e });
    },
    [total],
  );

  const nudge = (handle: "start" | "end", delta: number) => {
    const s = handle === "start" ? range.start + delta : range.start;
    const e = handle === "end" ? range.end + delta : range.end;
    update(s, e);
    if (handle === "start") seek(s);
    else seek(Math.max(s, e - 3000));
  };

  const save = async () => {
    if (range.end - range.start < MIN_GAP) {
      toast.error("A clip needs to be at least one second long.");
      return;
    }
    setSaving(true);
    try {
      const input = {
        trackUri: track.uri,
        trackName: track.title,
        artist: track.artist,
        imageUrl: track.imageUrl ?? null,
        durationMs: total || null,
        startTime: range.start,
        endTime: range.end,
      };
      const saved = clip ? await api.clips.update(clip.id, input) : await api.clips.create(input);
      toast.success(clip ? "Clip updated" : "Clip saved");
      onSaved?.(saved, Boolean(clip));
      onClose();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not save the clip.");
    } finally {
      setSaving(false);
    }
  };

  const loadedThisTrack = currentTrack?.uri === track.uri;
  const len = range.end - range.start;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal
      aria-label={clip ? "Edit clip" : "Create clip"}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[95dvh] w-full max-w-2xl flex-col overflow-y-auto rounded-t-3xl border border-line bg-surface shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="text-lg font-black">{clip ? "Edit clip" : "Create clip"}</h2>
          <IconButton label="Close" size={36} onClick={onClose}>
            <IconX size={18} />
          </IconButton>
        </div>

        <div className="px-5 pt-3">
          <div ref={slotRef} className="aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-white/10" />
          <p className="mt-3 line-clamp-1 font-semibold">{track.title}</p>
          <p className="truncate text-sm text-muted">{track.artist || "YouTube"}</p>
        </div>

        <div className="px-5 pt-4">
          {total > 0 ? (
            <RangeSlider
              duration={total}
              start={range.start}
              end={range.end}
              position={loadedThisTrack ? position : undefined}
              minGap={MIN_GAP}
              onChange={update}
              onCommit={(s, e, handle) => seek(handle === "start" ? s : Math.max(s, e - 3000))}
            />
          ) : (
            <div className="flex items-center gap-2 py-4 text-sm text-muted">
              <IconLoader size={16} /> Loading track length…
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 px-5 pt-3">
          {(["start", "end"] as const).map((handle) => (
            <div key={handle} className="rounded-2xl border border-line bg-surface-2 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-subtle">{handle}</span>
                <span className="font-mono text-base tabular-nums">{formatTimePrecise(range[handle])}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" onClick={() => nudge(handle, -1000)} className="flex-1 px-0" title="-1s">
                  −1s
                </Button>
                <Button size="sm" onClick={() => nudge(handle, -100)} className="flex-1 px-0" title="-0.1s">
                  −.1
                </Button>
                <Button size="sm" onClick={() => nudge(handle, 100)} className="flex-1 px-0" title="+0.1s">
                  +.1
                </Button>
                <Button size="sm" onClick={() => nudge(handle, 1000)} className="flex-1 px-0" title="+1s">
                  +1s
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 w-full"
                disabled={!loadedThisTrack}
                onClick={() => (handle === "start" ? update(position, range.end) : update(range.start, position))}
              >
                Set {handle} to playhead
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 px-5 pb-5 pt-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              disabled={!loadedThisTrack}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-text text-bg disabled:opacity-40"
            >
              {isPlaying ? <IconPause size={20} /> : <IconPlay size={20} className="translate-x-[6%]" />}
            </button>
            <div className="font-mono text-xs tabular-nums text-muted">
              <div>{loadedThisTrack ? formatTime(position) : "–:––"}</div>
              <div className="text-subtle">clip {formatTime(len)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} loading={saving} disabled={total <= 0}>
              {clip ? "Save changes" : "Save clip"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
