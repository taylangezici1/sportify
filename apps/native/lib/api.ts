import type { Clip, PlaylistSummary, Track } from "@repo/ui";
import { BACKEND_URL } from "./config";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let tokenProvider: () => string | null = () => null;
let onUnauthorized: () => void = () => {};

/** Wired up once by AuthProvider. */
export function configureApi(opts: { getToken: () => string | null; onUnauthorized: () => void }) {
  tokenProvider = opts.getToken;
  onUnauthorized = opts.onUnauthorized;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BACKEND_URL) throw new ApiError("EXPO_PUBLIC_BACKEND_URL is not set", 0);
  const token = tokenProvider();
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token) onUnauthorized();
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

export interface Profile {
  email?: string | null;
  name?: string | null;
  image?: string | null;
  chillPlaylistId: string | null;
}

export const api = {
  me: {
    get: () => request<Profile>("/api/me"),
    setChillPlaylist: (chillPlaylistId: string | null) =>
      request<{ chillPlaylistId: string | null }>("/api/me", {
        method: "PUT",
        body: JSON.stringify({ chillPlaylistId }),
      }),
  },
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
  mobile: {
    revokeToken: () => request<{ success: true }>("/api/mobile/token", { method: "DELETE" }),
  },
};
