import "server-only";
import type { PlaylistSummary, Track } from "@repo/ui";
import { youtubeUri } from "@repo/ui";

/**
 * Server-side YouTube Data API v3 helpers.
 *
 * Quota notes (10,000 units/day per Google Cloud project by default):
 *   search.list ........ 100 units   -> searches are explicit, never live-typed
 *   videos.list ........   1 unit    (up to 50 ids per call)
 *   playlists.list .....   1 unit
 *   playlistItems.list .   1 unit    (50 items per page)
 *
 * Requests use the caller's Google OAuth token when we have one (required for
 * private playlists such as Liked Music) and fall back to the project API key.
 */

const API = "https://www.googleapis.com/youtube/v3";
export const LIKED_MUSIC_PLAYLIST_ID = "LM";

export class YouTubeApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public reason?: string,
  ) {
    super(message);
    this.name = "YouTubeApiError";
  }
}

interface AuthOptions {
  accessToken?: string;
}

async function yt<T>(path: string, params: Record<string, string>, auth: AuthOptions = {}): Promise<T> {
  const url = new URL(`${API}/${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const headers: Record<string, string> = { Accept: "application/json" };
  if (auth.accessToken) {
    headers.Authorization = `Bearer ${auth.accessToken}`;
  } else if (process.env.YOUTUBE_API_KEY) {
    url.searchParams.set("key", process.env.YOUTUBE_API_KEY);
  } else {
    throw new YouTubeApiError("YOUTUBE_API_KEY is not configured", 500, "missingApiKey");
  }

  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) {
    let reason: string | undefined;
    let message = `YouTube API ${res.status}`;
    try {
      const body = await res.json();
      reason = body?.error?.errors?.[0]?.reason;
      message = body?.error?.message ?? message;
    } catch {
      /* non-JSON error body */
    }
    throw new YouTubeApiError(message, res.status, reason);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

/** Parses ISO-8601 durations such as PT3M42S into milliseconds. */
export function parseIsoDuration(iso: string | undefined): number | undefined {
  if (!iso) return undefined;
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!m) return undefined;
  const [, d, h, min, s] = m.map((x) => (x ? Number(x) : 0));
  return (((d * 24 + h) * 60 + min) * 60 + s) * 1000;
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const PLAYLIST_ID = /^(PL|UU|LL|LM|RD|OL|FL)[A-Za-z0-9_-]*$/;

/** Extracts a video id from a bare id or a youtube.com / youtu.be / music.youtube.com URL. */
export function extractVideoId(input: string): string | null {
  const s = input.trim();
  if (VIDEO_ID.test(s)) return s;
  try {
    const url = new URL(s);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      return VIDEO_ID.test(id) ? id : null;
    }
    if (host.endsWith("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v && VIDEO_ID.test(v)) return v;
      const parts = url.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex((p) => ["shorts", "embed", "live", "v"].includes(p));
      if (idx >= 0 && parts[idx + 1] && VIDEO_ID.test(parts[idx + 1])) return parts[idx + 1];
    }
  } catch {
    /* not a URL */
  }
  return null;
}

/** Extracts a playlist id from a bare id or a youtube / youtube music URL. */
export function extractPlaylistId(input: string): string | null {
  const s = input.trim();
  if (PLAYLIST_ID.test(s)) return s;
  try {
    const url = new URL(s);
    const list = url.searchParams.get("list");
    if (list && PLAYLIST_ID.test(list)) return list;
  } catch {
    /* not a URL */
  }
  return null;
}

function cleanChannel(name: string | undefined): string {
  return (name ?? "").replace(/\s*-\s*Topic$/i, "").trim();
}

function bestThumb(thumbs: Record<string, { url: string }> | undefined): string | undefined {
  if (!thumbs) return undefined;
  return (thumbs.medium ?? thumbs.high ?? thumbs.default ?? thumbs.maxres)?.url;
}

// ---------------------------------------------------------------------------
// API surface
// ---------------------------------------------------------------------------

interface VideoResource {
  id: string;
  snippet?: {
    title: string;
    channelTitle?: string;
    thumbnails?: Record<string, { url: string }>;
  };
  contentDetails?: { duration?: string };
  status?: { embeddable?: boolean; privacyStatus?: string };
}

function toTrack(v: VideoResource): Track {
  return {
    uri: youtubeUri(v.id),
    title: v.snippet?.title ?? "Untitled",
    artist: cleanChannel(v.snippet?.channelTitle),
    imageUrl: bestThumb(v.snippet?.thumbnails),
    durationMs: parseIsoDuration(v.contentDetails?.duration),
  };
}

/** Full details (title, channel, thumbnail, duration) for any number of ids, 50 per call. */
export async function getVideos(ids: string[], auth: AuthOptions = {}): Promise<Track[]> {
  const out: Track[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    if (batch.length === 0) continue;
    const data = await yt<{ items: VideoResource[] }>(
      "videos",
      { part: "snippet,contentDetails,status", id: batch.join(","), maxResults: "50" },
      auth,
    );
    for (const v of data.items ?? []) {
      if (v.status?.embeddable === false) continue;
      out.push(toTrack(v));
    }
  }
  const order = new Map(ids.map((id, i) => [youtubeUri(id), i]));
  return out.sort((a, b) => (order.get(a.uri) ?? 0) - (order.get(b.uri) ?? 0));
}

/**
 * Searches music videos. A pasted YouTube / YouTube Music link or bare video id
 * short-circuits to a single videos.list lookup (1 unit instead of 101).
 */
export async function searchTracks(query: string, auth: AuthOptions = {}): Promise<Track[]> {
  const direct = extractVideoId(query);
  if (direct) return getVideos([direct], auth);

  const data = await yt<{ items: { id: { videoId: string } }[] }>(
    "search",
    {
      part: "id",
      type: "video",
      videoCategoryId: "10", // Music
      videoEmbeddable: "true",
      maxResults: "20",
      q: query,
    },
    auth,
  );
  const ids = (data.items ?? []).map((i) => i.id.videoId).filter(Boolean);
  return ids.length ? getVideos(ids, auth) : [];
}

interface PlaylistResource {
  id: string;
  snippet?: {
    title: string;
    channelTitle?: string;
    thumbnails?: Record<string, { url: string }>;
  };
  contentDetails?: { itemCount?: number };
}

function toPlaylistSummary(p: PlaylistResource): PlaylistSummary {
  return {
    id: p.id,
    title: p.snippet?.title ?? "Untitled playlist",
    imageUrl: bestThumb(p.snippet?.thumbnails),
    itemCount: p.contentDetails?.itemCount ?? 0,
    owner: cleanChannel(p.snippet?.channelTitle),
  };
}

const LIKED_MUSIC: PlaylistSummary = {
  id: LIKED_MUSIC_PLAYLIST_ID,
  title: "Liked Music",
  itemCount: 0,
  owner: "You",
};

/** The signed-in user's playlists (YouTube Music playlists live here too), plus Liked Music. */
export async function getMyPlaylists(accessToken: string): Promise<PlaylistSummary[]> {
  const out: PlaylistSummary[] = [LIKED_MUSIC];
  let pageToken: string | undefined;
  let pages = 0;
  do {
    const data = await yt<{ items: PlaylistResource[]; nextPageToken?: string }>(
      "playlists",
      {
        part: "snippet,contentDetails",
        mine: "true",
        maxResults: "50",
        ...(pageToken ? { pageToken } : {}),
      },
      { accessToken },
    );
    out.push(...(data.items ?? []).map(toPlaylistSummary));
    pageToken = data.nextPageToken;
    pages += 1;
  } while (pageToken && pages < 4);
  return out;
}

/** Metadata for one playlist. Works with the API key for public / unlisted lists. */
export async function getPlaylist(id: string, auth: AuthOptions = {}): Promise<PlaylistSummary | null> {
  if (id === LIKED_MUSIC_PLAYLIST_ID) return LIKED_MUSIC;
  const data = await yt<{ items: PlaylistResource[] }>("playlists", { part: "snippet,contentDetails", id }, auth);
  const p = data.items?.[0];
  return p ? toPlaylistSummary(p) : null;
}

interface PlaylistItemResource {
  snippet?: { title?: string; resourceId?: { videoId?: string } };
}

/** Every playable track in a playlist, in playlist order (capped at 500 items). */
export async function getPlaylistTracks(id: string, auth: AuthOptions = {}): Promise<Track[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;
  let pages = 0;
  do {
    const data = await yt<{ items: PlaylistItemResource[]; nextPageToken?: string }>(
      "playlistItems",
      {
        part: "snippet",
        playlistId: id,
        maxResults: "50",
        ...(pageToken ? { pageToken } : {}),
      },
      auth,
    );
    for (const item of data.items ?? []) {
      const videoId = item.snippet?.resourceId?.videoId;
      const title = item.snippet?.title ?? "";
      if (!videoId || title === "Private video" || title === "Deleted video") continue;
      ids.push(videoId);
    }
    pageToken = data.nextPageToken;
    pages += 1;
  } while (pageToken && pages < 10);
  return getVideos(ids, auth);
}
