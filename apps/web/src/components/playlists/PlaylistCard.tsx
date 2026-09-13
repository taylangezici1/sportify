"use client";

import Link from "next/link";
import type { PlaylistSummary } from "@repo/ui";
import { IconHeart, IconSnowflake } from "@/components/ui/Icons";
import { Thumb } from "@/components/ui/primitives";

interface PlaylistCardProps {
  playlist: PlaylistSummary;
  isChill: boolean;
  onSetChill: (playlist: PlaylistSummary) => void;
}

export default function PlaylistCard({ playlist, isChill, onSetChill }: PlaylistCardProps) {
  const liked = playlist.id === "LM";
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-surface transition-colors ${
        isChill ? "border-chill/60" : "border-line hover:border-subtle"
      }`}
    >
      <Link href={`/playlist/${encodeURIComponent(playlist.id)}`} className="block">
        {liked ? (
          <div className="flex aspect-video w-full items-center justify-center bg-linear-to-br from-[#3b1f5e] to-[#1a1a2e] text-white">
            <IconHeart size={40} fill="currentColor" />
          </div>
        ) : (
          <Thumb src={playlist.imageUrl} alt="" className="aspect-video w-full" rounded="rounded-none" />
        )}
        <div className="p-3">
          <p className="truncate text-sm font-semibold">{playlist.title}</p>
          <p className="truncate text-xs text-muted">
            {playlist.itemCount > 0 ? `${playlist.itemCount} tracks` : playlist.owner || "Playlist"}
          </p>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => onSetChill(playlist)}
        aria-pressed={isChill}
        title={isChill ? "Current chill playlist" : "Use for chill mode"}
        className={`absolute right-2 top-2 inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[11px] font-bold uppercase tracking-wider shadow-lg transition-all ${
          isChill ? "bg-chill text-black" : "bg-black/60 text-white opacity-0 backdrop-blur group-hover:opacity-100 hover:bg-chill hover:text-black focus-visible:opacity-100"
        }`}
      >
        <IconSnowflake size={13} />
        {isChill ? "Chill" : "Set chill"}
      </button>
    </div>
  );
}
