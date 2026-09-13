"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import type { Track } from "@repo/ui";
import { api, ApiError } from "@/lib/client-api";
import { formatTime } from "@/lib/format";
import SearchBox from "@/components/search/SearchBox";
import TrackList from "@/components/tracks/TrackList";
import ClipperModal from "@/components/clips/ClipperModal";
import { IconScissors, IconSearch, IconX, IconYouTube } from "@/components/ui/Icons";
import { EmptyState, Page, PageHeader } from "@/components/ui/primitives";

const RECENT_KEY = "sportify:recent-searches";

function readRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function SearchContent() {
  const params = useSearchParams();
  const router = useRouter();
  const initialQuery = params.get("q") ?? "";
  const legacy = (() => {
    const start = Number(params.get("start"));
    const end = Number(params.get("end"));
    const id = params.get("legacy");
    if (!id || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
    return { id, start, end, name: initialQuery };
  })();

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Track[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [clipping, setClipping] = useState<Track | null>(null);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => setRecent(readRecent()), []);

  const search = useCallback(async (q: string) => {
    setQuery(q);
    setLoading(true);
    try {
      const { tracks } = await api.search(q);
      setResults(tracks);
      const next = [q, ...readRecent().filter((x) => x !== q)].slice(0, 8);
      setRecent(next);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    } catch (e) {
      setResults([]);
      toast.error(e instanceof ApiError ? e.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) void search(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on first load / param change
  }, [initialQuery]);

  const onSaved = async () => {
    if (!legacy) return;
    try {
      await api.clips.remove(legacy.id);
      toast.success("Replaced the old Spotify clip.");
    } catch {
      /* the new clip exists; leaving the old one is harmless */
    }
    router.replace("/clips");
  };

  return (
    <Page>
      <PageHeader title="Search" subtitle="Anything on YouTube Music. Paste a video link to skip the search." />

      {legacy && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-line bg-surface-2 px-4 py-3 text-sm">
          <IconScissors size={16} className="shrink-0 text-workout" />
          <p className="flex-1">
            Recreating <span className="font-semibold">{legacy.name}</span> · {formatTime(legacy.start)} –{" "}
            {formatTime(legacy.end)}. Pick the matching video and the range is pre-filled.
          </p>
          <button
            onClick={() => router.replace("/search")}
            className="rounded-full p-1.5 text-muted hover:bg-surface-3 hover:text-text"
            aria-label="Dismiss"
          >
            <IconX size={16} />
          </button>
        </div>
      )}

      <SearchBox initialValue={query} loading={loading} autoFocus={!initialQuery} onSearch={search} />

      {results === null && !loading ? (
        <div className="mt-8">
          {recent.length > 0 && (
            <div className="mb-8">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-subtle">Recent</p>
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => (
                  <button
                    key={r}
                    onClick={() => search(r)}
                    className="rounded-full bg-surface-2 px-3 py-1.5 text-sm text-muted hover:bg-surface-3 hover:text-text"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
          <EmptyState
            icon={<IconYouTube size={40} />}
            title="Find something to clip"
            description="Search by song or artist, or paste a youtube.com, youtu.be or music.youtube.com link."
          />
        </div>
      ) : results && results.length === 0 && !loading ? (
        <div className="mt-8">
          <EmptyState icon={<IconSearch size={40} />} title="No music found" description={`Nothing matched “${query}”.`} />
        </div>
      ) : (
        <div className="mt-6">
          {results && <TrackList tracks={results} onClip={setClipping} />}
        </div>
      )}

      {clipping && (
        <ClipperModal
          track={clipping}
          initialRange={legacy ? { start: legacy.start, end: legacy.end } : undefined}
          onClose={() => setClipping(null)}
          onSaved={onSaved}
        />
      )}
    </Page>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
