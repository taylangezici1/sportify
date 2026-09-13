"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { Clip, PlaylistSummary } from "@repo/ui";
import { trackSource } from "@repo/ui";
import { usePlayer } from "@/context/PlayerContext";
import { useModeActions } from "@/components/layout/useModeActions";
import { api } from "@/lib/client-api";
import { formatTime } from "@/lib/format";
import { clipThumb } from "@/components/clips/ClipsView";
import { IconFlame, IconListMusic, IconPlay, IconScissors, IconSearch, IconSnowflake } from "@/components/ui/Icons";
import { Button, Page, Skeleton, Thumb } from "@/components/ui/primitives";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Late night session";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const { data: session } = useSession();
  const { playlists, loadPlaylists, chillPlaylistId, playClip, activeClip } = usePlayer();
  const { start, starting } = useModeActions();
  const [clips, setClips] = useState<Clip[] | null>(null);

  useEffect(() => {
    api.clips.list().then(setClips).catch(() => setClips([]));
    void loadPlaylists();
  }, [loadPlaylists]);

  const playable = (clips ?? []).filter((c) => trackSource(c.trackUri) === "youtube");
  const chill: PlaylistSummary | undefined = playlists.find((p) => p.id === chillPlaylistId);
  const firstName = session?.user?.name?.split(" ")[0];

  return (
    <Page>
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight md:text-4xl">
          {greeting()}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-1 text-muted">Pick a mode and go.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="relative overflow-hidden rounded-3xl border border-workout/30 bg-linear-to-br from-workout/20 via-surface to-surface p-6">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-workout/20 blur-3xl" />
          <div className="relative">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-workout/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-workout">
              <IconFlame size={14} /> Workout
            </div>
            <h2 className="text-2xl font-black">Your clips, back to back</h2>
            <p className="mt-1 text-sm text-muted">
              {clips === null ? "Counting your clips…" : playable.length === 0 ? "No clips yet. Make your first one from search." : `${playable.length} clip${playable.length === 1 ? "" : "s"} · shuffled`}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                variant="workout"
                size="lg"
                icon={<IconPlay size={18} />}
                loading={starting === "workout"}
                onClick={() => start("workout", { force: true })}
                disabled={clips !== null && playable.length === 0}
              >
                Start workout
              </Button>
              <Link href="/search">
                <Button size="lg" icon={<IconScissors size={16} />}>
                  New clip
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-chill/30 bg-linear-to-br from-chill/20 via-surface to-surface p-6">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-chill/20 blur-3xl" />
          <div className="relative">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-chill/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-chill">
              <IconSnowflake size={14} /> Chill
            </div>
            <h2 className="text-2xl font-black">{chill ? chill.title : "Shuffle a playlist"}</h2>
            <p className="mt-1 text-sm text-muted">
              {chill ? "Full tracks, shuffled, from your YouTube Music playlist." : "Choose one of your YouTube Music playlists for chill mode."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                variant="chill"
                size="lg"
                icon={<IconPlay size={18} />}
                loading={starting === "chill"}
                onClick={() => start("chill", { force: true })}
              >
                {chill ? "Start chill" : "Pick a playlist"}
              </Button>
              <Link href="/playlists">
                <Button size="lg" icon={<IconListMusic size={16} />}>
                  Playlists
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-bold">Recent clips</h2>
          <Link href="/clips" className="text-sm text-muted hover:text-text">
            See all
          </Link>
        </div>
        {clips === null ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="aspect-video w-full" />
            ))}
          </div>
        ) : playable.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line p-6 text-sm text-muted">
            Nothing here yet.{" "}
            <Link href="/search" className="text-text underline underline-offset-4">
              Search for a track
            </Link>{" "}
            and hit Clip.
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {playable.slice(0, 5).map((clip) => (
              <li key={clip.id}>
                <button
                  type="button"
                  onClick={() => playClip(clip, playable)}
                  className={`group block w-full overflow-hidden rounded-2xl border bg-surface text-left transition-colors ${
                    activeClip?.id === clip.id ? "border-workout/60" : "border-line hover:border-subtle"
                  }`}
                >
                  <div className="relative">
                    <Thumb src={clipThumb(clip)} alt="" className="aspect-video w-full" rounded="rounded-none" />
                    <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 font-mono text-[11px] text-white">
                      {formatTime(clip.endTime - clip.startTime)}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-semibold">{clip.trackName}</p>
                    <p className="truncate text-xs text-muted">{clip.artist || "YouTube"}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {playlists.length > 1 && (
        <section className="mt-10">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-bold">Your playlists</h2>
            <Link href="/playlists" className="text-sm text-muted hover:text-text">
              See all
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {playlists.slice(0, 5).map((p) => (
              <li key={p.id}>
                <Link
                  href={`/playlist/${encodeURIComponent(p.id)}`}
                  className="block overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-subtle"
                >
                  {p.id === "LM" ? (
                    <div className="flex aspect-video items-center justify-center bg-linear-to-br from-[#3b1f5e] to-[#1a1a2e]">
                      <IconListMusic size={28} />
                    </div>
                  ) : (
                    <Thumb src={p.imageUrl} alt="" className="aspect-video w-full" rounded="rounded-none" />
                  )}
                  <div className="p-3">
                    <p className="truncate text-sm font-semibold">{p.title}</p>
                    <p className="truncate text-xs text-muted">{p.itemCount ? `${p.itemCount} tracks` : p.owner}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-12 hidden text-xs text-subtle md:block">
        Shortcuts: <kbd className="rounded bg-surface-3 px-1">space</kbd> play/pause ·{" "}
        <kbd className="rounded bg-surface-3 px-1">←</kbd> <kbd className="rounded bg-surface-3 px-1">→</kbd> seek 5s ·{" "}
        <kbd className="rounded bg-surface-3 px-1">n</kbd> next · <kbd className="rounded bg-surface-3 px-1">p</kbd> previous ·{" "}
        <kbd className="rounded bg-surface-3 px-1">s</kbd> shuffle · <kbd className="rounded bg-surface-3 px-1">m</kbd> mute
        <IconSearch size={0} />
      </p>
    </Page>
  );
}
