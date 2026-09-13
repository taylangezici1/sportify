/**
 * Shared domain types.
 *
 * The web app is provider-agnostic: a `Track` is anything the player can play
 * and a `Clip` is a [start, end] window over a track. Track identity is the
 * `uri` string, namespaced by source: `youtube:<videoId>` today, and the
 * legacy `spotify:track:<id>` for clips created before the YouTube migration.
 */

export type TrackSource = "youtube" | "spotify" | "unknown";

export interface Track {
  /** Namespaced identifier, e.g. `youtube:dQw4w9WgXcQ`. */
  uri: string;
  title: string;
  artist: string;
  /** Thumbnail / artwork URL. */
  imageUrl?: string;
  /** Full length in milliseconds when known. */
  durationMs?: number;
}

export interface Clip {
  id: string;
  trackUri: string;
  trackName: string;
  startTime: number;
  endTime: number;
  artist?: string | null;
  imageUrl?: string | null;
  durationMs?: number | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface PlaylistSummary {
  id: string;
  title: string;
  imageUrl?: string;
  itemCount: number;
  owner?: string;
}

export function trackSource(uri: string | null | undefined): TrackSource {
  if (!uri) return "unknown";
  if (uri.startsWith("youtube:")) return "youtube";
  if (uri.startsWith("spotify:")) return "spotify";
  return "unknown";
}

export function youtubeVideoId(uri: string | null | undefined): string | null {
  if (!uri || !uri.startsWith("youtube:")) return null;
  return uri.slice("youtube:".length) || null;
}

export function youtubeUri(videoId: string): string {
  return `youtube:${videoId}`;
}

export function clipToTrack(clip: Clip): Track {
  return {
    uri: clip.trackUri,
    title: clip.trackName,
    artist: clip.artist ?? "",
    imageUrl: clip.imageUrl ?? undefined,
    durationMs: clip.durationMs ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Legacy shapes still consumed by apps/native (Spotify remote-control build).
// ---------------------------------------------------------------------------

/** @deprecated Spotify playlist shape; only apps/native still uses it. */
export interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
  tracks: { total: number };
  uri: string;
  owner: { display_name: string };
}

/** @deprecated Only apps/native still uses it. */
export interface CurrentTrack {
  name: string;
  artist: string;
  image: string;
}

/** @deprecated Spotify-era context contract; only apps/native still uses it. */
export interface PlayerContextType {
  player: any;
  deviceId: string | null;
  isPaused: boolean;
  isActive: boolean;
  currentPosition: number;
  duration: number;
  trackUri: string | null;
  currentTrack: CurrentTrack | null;
  activeClip: Clip | null;
  isShuffle: boolean;
  playTrack: (uri: string) => void;
  playClip: (clip: Clip, queue?: Clip[]) => void;
  togglePlay: () => void;
  seek: (position: number) => void;
  nextClip: () => void;
  previousClip: () => void;
  toggleShuffle: () => void;
  setVolume: (volume: number) => void;
  mode: "workout" | "chill";
  toggleMode: () => void;
  playlists: Playlist[];
  chillPlaylistId: string | null;
  setChillPlaylistId: (id: string) => Promise<void>;
  session: any;
  signIn: () => void;
}
