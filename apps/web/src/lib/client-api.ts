import type { Clip, PlaylistSummary, Track } from "@repo/ui";

/** Typed fetch helpers for the app's own API routes (browser side). */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data?.error ?? res.statusText ?? "Request failed", res.status);
  return data as T;
}

export interface ClipInput {
  trackUri: string;
  trackName: string;
  startTime: number;
  endTime: number;
  artist?: string | null;
  imageUrl?: string | null;
  durationMs?: number | null;
}

export const api = {
  clips: {
    list: () => request<Clip[]>("/api/clips"),
    create: (input: ClipInput) => request<Clip>("/api/clips", { method: "POST", body: JSON.stringify(input) }),
    update: (id: string, input: Partial<ClipInput>) =>
      request<Clip>(`/api/clips/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    remove: (id: string) => request<{ success: true }>(`/api/clips/${id}`, { method: "DELETE" }),
  },
  search: (q: string) => request<{ tracks: Track[] }>(`/api/search?q=${encodeURIComponent(q)}`),
  playlists: {
    mine: () => request<{ playlists: PlaylistSummary[] }>("/api/playlists"),
    get: (idOrUrl: string) =>
      request<{ playlist: PlaylistSummary; tracks: Track[] }>(`/api/playlists/${encodeURIComponent(idOrUrl)}`),
  },
  me: {
    get: () => request<{ chillPlaylistId: string | null }>("/api/me"),
    setChillPlaylist: (chillPlaylistId: string | null) =>
      request<{ chillPlaylistId: string | null }>("/api/me", {
        method: "PUT",
        body: JSON.stringify({ chillPlaylistId }),
      }),
  },
};

/** YouTube thumbnail for a video id at a given size (all 16:9 except hq). */
export function thumbnailUrl(videoId: string, size: "mq" | "hq" | "maxres" = "mq"): string {
  return `https://i.ytimg.com/vi/${videoId}/${size}default.jpg`;
}
