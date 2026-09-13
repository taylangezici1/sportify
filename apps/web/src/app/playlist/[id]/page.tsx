"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import type { PlaylistSummary, Track } from "@repo/ui";
import { usePlayer } from "@/context/PlayerContext";
import { api, ApiError } from "@/lib/client-api";
import { formatTime } from "@/lib/format";
import TrackList from "@/components/tracks/TrackList";
import ClipperModal from "@/components/clips/ClipperModal";
import { IconHeart, IconPlay, IconShuffle, IconSnowflake } from "@/components/ui/Icons";
import { Button, EmptyState, Page, Spinner, Thumb } from "@/components/ui/primitives";

export default function PlaylistPage() {
  const { id } = useParams<{ id: string }>();
  const { playTracks, chillPlaylistId, setChillPlaylistId } = usePlayer();
  type Loaded = { id: string; data?: { playlist: PlaylistSummary; tracks: Track[] }; error?: string };
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [clipping, setClipping] = useState<Track | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api.playlists
      .get(decodeURIComponent(id))
      .then((data) => !cancelled && setLoaded({ id, data }))
      .catch((e) => !cancelled && setLoaded({ id, error: e instanceof ApiError ? e.message : "Could not load this playlist." }));
    return () => {
      cancelled = true;
    };
  }, [id]);

  // State from a previous playlist id is stale while the new one loads.
  const current = loaded?.id === id ? loaded : null;
  const data = current?.data ?? null;
  const error = current?.error ?? null;

  if (error) {
    return (
      <Page>
        <EmptyState title="Playlist unavailable" description={error} />
      </Page>
    );
  }
  if (!data) {
    return (
      <Page>
        <Spinner label="Loading playlist" />
      </Page>
    );
  }

  const { playlist, tracks } = data;
  const isChill = playlist.id === chillPlaylistId;
  const totalMs = tracks.reduce((sum, t) => sum + (t.durationMs ?? 0), 0);

  return (
    <Page>
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end">
        {playlist.id === "LM" ? (
          <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-linear-to-br from-[#3b1f5e] to-[#1a1a2e] text-white shadow-xl sm:w-64">
            <IconHeart size={48} fill="currentColor" />
          </div>
        ) : (
          <Thumb src={playlist.imageUrl} alt="" className="aspect-video w-full shadow-xl sm:w-64" rounded="rounded-2xl" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Playlist</p>
          <h1 className="mt-1 line-clamp-2 text-3xl font-black tracking-tight md:text-4xl">{playlist.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {playlist.owner ? `${playlist.owner} · ` : ""}
            {tracks.length} tracks{totalMs > 0 ? ` · ${formatTime(totalMs)}` : ""}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary" icon={<IconPlay size={16} />} disabled={!tracks.length} onClick={() => playTracks(tracks)}>
              Play
            </Button>
            <Button icon={<IconShuffle size={16} />} disabled={!tracks.length} onClick={() => playTracks(tracks, { shuffle: true })}>
              Shuffle
            </Button>
            <Button
              variant={isChill ? "chill" : "secondary"}
              icon={<IconSnowflake size={16} />}
              onClick={async () => {
                if (isChill) return;
                await setChillPlaylistId(playlist.id);
                toast.success(`${playlist.title} is now your chill playlist`);
              }}
            >
              {isChill ? "Chill playlist" : "Use for chill"}
            </Button>
          </div>
        </div>
      </header>

      {tracks.length === 0 ? (
        <EmptyState title="No playable tracks" description="Every video in this playlist is private, deleted or not embeddable." />
      ) : (
        <TrackList tracks={tracks} onClip={setClipping} queueAll numbered />
      )}

      {clipping && <ClipperModal track={clipping} onClose={() => setClipping(null)} />}
    </Page>
  );
}
