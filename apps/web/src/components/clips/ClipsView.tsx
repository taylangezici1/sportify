"use client";

import Link from "next/link";
import type { Clip } from "@repo/ui";
import { trackSource, youtubeVideoId } from "@repo/ui";
import { usePlayer } from "@/context/PlayerContext";
import { formatTime, relativeDate } from "@/lib/format";
import { useLocalStorageValue } from "@/lib/use-local-storage";
import { IconEdit, IconGrid, IconList, IconPause, IconPlay, IconSearch, IconTrash } from "@/components/ui/Icons";
import { Badge, IconButton, Thumb } from "@/components/ui/primitives";

interface ClipsViewProps {
  clips: Clip[];
  onEdit: (clip: Clip) => void;
  onDelete: (clip: Clip) => void;
}

const VIEW_KEY = "sportify:clips-view";
type View = "list" | "grid";
const isView = (v: string): v is View => v === "list" || v === "grid";

function EqBars() {
  return (
    <span className="flex h-3.5 items-end gap-0.5" aria-hidden>
      {[0, 0.2, 0.4].map((d) => (
        <span key={d} className="eq-bar w-0.5 rounded-sm bg-current" style={{ height: "100%", animationDelay: `${d}s` }} />
      ))}
    </span>
  );
}

export function clipThumb(clip: Clip) {
  if (clip.imageUrl) return clip.imageUrl;
  const id = youtubeVideoId(clip.trackUri);
  return id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : undefined;
}

export default function ClipsView({ clips, onEdit, onDelete }: ClipsViewProps) {
  const { playClip, activeClip, isPlaying, togglePlay } = usePlayer();
  const [view, changeView] = useLocalStorageValue<View>(VIEW_KEY, "list", isView);

  const playable = clips.filter((c) => trackSource(c.trackUri) === "youtube");
  const legacy = clips.filter((c) => trackSource(c.trackUri) !== "youtube");

  const play = (clip: Clip) => {
    if (activeClip?.id === clip.id) togglePlay();
    else playClip(clip, playable);
  };

  const actions = (clip: Clip, className = "") => (
    <div className={`flex items-center gap-1 ${className}`}>
      <IconButton label="Edit clip" size={34} onClick={(e) => (e.stopPropagation(), onEdit(clip))}>
        <IconEdit size={16} />
      </IconButton>
      <IconButton
        label="Delete clip"
        size={34}
        className="hover:!bg-danger/15 hover:!text-danger"
        onClick={(e) => (e.stopPropagation(), onDelete(clip))}
      >
        <IconTrash size={16} />
      </IconButton>
    </div>
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">
          {playable.length} clip{playable.length === 1 ? "" : "s"}
          {legacy.length > 0 && <span className="text-subtle"> · {legacy.length} from Spotify</span>}
        </p>
        <div className="flex rounded-full bg-surface-2 p-1">
          <IconButton label="List view" size={30} active={view === "list"} onClick={() => changeView("list")}>
            <IconList size={16} />
          </IconButton>
          <IconButton label="Grid view" size={30} active={view === "grid"} onClick={() => changeView("grid")}>
            <IconGrid size={16} />
          </IconButton>
        </div>
      </div>

      {view === "list" ? (
        <ul className="flex flex-col gap-1">
          {playable.map((clip) => {
            const active = activeClip?.id === clip.id;
            return (
              <li key={clip.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => play(clip)}
                  onKeyDown={(e) => e.key === "Enter" && play(clip)}
                  className={`group flex cursor-pointer items-center gap-3 rounded-xl p-2 pr-3 transition-colors ${
                    active ? "bg-surface-3" : "hover:bg-surface-2"
                  }`}
                >
                  <div className="relative">
                    <Thumb src={clipThumb(clip)} alt="" className="aspect-video h-12 md:h-14" rounded="rounded-lg" />
                    <div
                      className={`absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 text-white transition-opacity ${
                        active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {active && isPlaying ? <IconPause size={20} /> : <IconPlay size={20} />}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`flex items-center gap-2 truncate font-semibold ${active ? "text-workout" : ""}`}>
                      {active && isPlaying && <EqBars />}
                      <span className="truncate">{clip.trackName}</span>
                    </p>
                    <p className="truncate text-xs text-muted">
                      {clip.artist ? `${clip.artist} · ` : ""}
                      <span className="font-mono tabular-nums">
                        {formatTime(clip.startTime)} – {formatTime(clip.endTime)}
                      </span>
                    </p>
                  </div>
                  <span className="hidden w-14 shrink-0 text-right font-mono text-xs tabular-nums text-muted sm:block">
                    {formatTime(clip.endTime - clip.startTime)}
                  </span>
                  <span className="hidden w-20 shrink-0 text-right text-xs text-subtle md:block">{relativeDate(clip.createdAt)}</span>
                  {actions(clip, "opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100")}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {playable.map((clip) => {
            const active = activeClip?.id === clip.id;
            return (
              <li key={clip.id} className={`group overflow-hidden rounded-2xl border bg-surface transition-colors ${active ? "border-workout/60" : "border-line hover:border-subtle"}`}>
                <button type="button" onClick={() => play(clip)} className="relative block w-full text-left">
                  <Thumb src={clipThumb(clip)} alt="" className="aspect-video w-full" rounded="rounded-none" />
                  <div
                    className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${
                      active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-text text-bg shadow-lg">
                      {active && isPlaying ? <IconPause size={22} /> : <IconPlay size={22} className="translate-x-[6%]" />}
                    </span>
                  </div>
                  <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-white">
                    {formatTime(clip.endTime - clip.startTime)}
                  </span>
                </button>
                <div className="flex items-start gap-2 p-3">
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-semibold ${active ? "text-workout" : ""}`}>{clip.trackName}</p>
                    <p className="truncate text-xs text-muted">{clip.artist || "YouTube"}</p>
                    <p className="mt-1 font-mono text-[11px] tabular-nums text-subtle">
                      {formatTime(clip.startTime)} – {formatTime(clip.endTime)}
                    </p>
                  </div>
                  {actions(clip, "-mr-2")}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {legacy.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">From your Spotify days</h2>
          <p className="mb-3 mt-1 text-sm text-subtle">
            These were clipped on Spotify and cannot play anymore. Find the same track on YouTube and the
            start / end times will be pre-filled; saving replaces the old clip.
          </p>
          <ul className="flex flex-col gap-1">
            {legacy.map((clip) => (
              <li key={clip.id} className="flex items-center gap-3 rounded-xl p-2 pr-3 hover:bg-surface-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-muted">{clip.trackName}</p>
                  <p className="truncate font-mono text-xs tabular-nums text-subtle">
                    {formatTime(clip.startTime)} – {formatTime(clip.endTime)}
                  </p>
                </div>
                <Badge>Spotify</Badge>
                <Link
                  href={`/search?q=${encodeURIComponent(clip.trackName)}&start=${clip.startTime}&end=${clip.endTime}&legacy=${clip.id}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface-3 px-3 text-xs font-semibold hover:bg-[#333338]"
                >
                  <IconSearch size={14} /> Find on YouTube
                </Link>
                <IconButton
                  label="Delete clip"
                  size={34}
                  className="hover:!bg-danger/15 hover:!text-danger"
                  onClick={() => onDelete(clip)}
                >
                  <IconTrash size={16} />
                </IconButton>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
