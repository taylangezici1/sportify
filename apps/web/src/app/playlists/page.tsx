"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { PlaylistSummary } from "@repo/ui";
import { usePlayer } from "@/context/PlayerContext";
import PlaylistCard from "@/components/playlists/PlaylistCard";
import { IconLink, IconListMusic } from "@/components/ui/Icons";
import { Button, EmptyState, Page, PageHeader, Skeleton } from "@/components/ui/primitives";

export default function PlaylistsPage() {
  const { playlists, playlistsLoading, loadPlaylists, chillPlaylistId, setChillPlaylistId } = usePlayer();
  const router = useRouter();
  const [link, setLink] = useState("");

  useEffect(() => {
    void loadPlaylists();
  }, [loadPlaylists]);

  const setChill = async (p: PlaylistSummary) => {
    if (p.id === chillPlaylistId) return;
    await setChillPlaylistId(p.id);
    toast.success(`${p.title} is now your chill playlist`);
  };

  const openLink = (e: FormEvent) => {
    e.preventDefault();
    const v = link.trim();
    if (!v) return;
    router.push(`/playlist/${encodeURIComponent(v)}`);
  };

  return (
    <Page>
      <PageHeader
        title="Playlists"
        subtitle="Your YouTube Music playlists. Mark one as the chill playlist to shuffle it in chill mode."
        actions={
          <Button onClick={() => loadPlaylists(true)} loading={playlistsLoading}>
            Refresh
          </Button>
        }
      />

      <form onSubmit={openLink} className="mb-8 flex gap-2">
        <div className="relative flex-1">
          <IconLink size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Open any public playlist by link or id…"
            aria-label="Playlist link"
            className="h-12 w-full rounded-2xl border border-line bg-surface pl-11 pr-4 text-sm placeholder:text-subtle focus:border-subtle focus:outline-none focus:ring-2 focus:ring-white/10"
          />
        </div>
        <Button type="submit" variant="primary" disabled={!link.trim()}>
          Open
        </Button>
      </form>

      {playlistsLoading && playlists.length === 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[16/12] w-full" />
          ))}
        </div>
      ) : playlists.length === 0 ? (
        <EmptyState
          icon={<IconListMusic size={40} />}
          title="No playlists found"
          description="If you just signed in, hit Refresh. Playlists you create in YouTube Music show up here."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {playlists.map((p) => (
            <li key={p.id}>
              <PlaylistCard playlist={p} isChill={p.id === chillPlaylistId} onSetChill={setChill} />
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
