"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import type { Clip, PlaylistSummary, Track } from "@repo/ui";
import { clipToTrack, trackSource, youtubeVideoId } from "@repo/ui";
import { YouTubeEngine, type EngineState } from "@/lib/player/youtube-engine";
import { api, ApiError } from "@/lib/client-api";
import { clamp, shuffle } from "@/lib/format";

export const PLAYER_HOST_ID = "yt-player-host";

export type Mode = "workout" | "chill";
export type Status = "idle" | "loading" | "playing" | "paused" | "ended";
export type QueueItem = { kind: "track"; track: Track } | { kind: "clip"; clip: Clip };
export interface Range {
  start: number;
  end: number;
}
export interface StageSlot {
  el: HTMLElement;
  interactive: boolean;
  /** Stacking level of the host surface; modals pass a higher value. */
  zIndex: number;
}
export interface StageSlotOptions {
  interactive?: boolean;
  enabled?: boolean;
  zIndex?: number;
}
export type StartResult = { ok: true } | { ok: false; reason: "no-clips" | "no-playlist" | "error" };

export interface PlayerContextValue {
  engineReady: boolean;
  status: Status;
  buffering: boolean;
  isActive: boolean;
  isPlaying: boolean;
  currentItem: QueueItem | null;
  currentTrack: Track | null;
  activeClip: Clip | null;
  position: number;
  duration: number;
  queue: QueueItem[];
  queueIndex: number;
  mode: Mode;
  isShuffle: boolean;
  volume: number;
  muted: boolean;
  previewRange: Range | null;

  playlists: PlaylistSummary[];
  playlistsLoading: boolean;
  loadPlaylists: (force?: boolean) => Promise<PlaylistSummary[]>;
  chillPlaylistId: string | null;
  setChillPlaylistId: (id: string | null) => Promise<void>;

  playTrack: (track: Track, opts?: { startMs?: number; queue?: Track[] }) => void;
  playTracks: (tracks: Track[], opts?: { startIndex?: number; shuffle?: boolean }) => void;
  playClip: (clip: Clip, queue?: Clip[], opts?: { shuffled?: boolean }) => void;
  playQueueIndex: (index: number) => void;
  startWorkout: () => Promise<StartResult>;
  startChill: () => Promise<StartResult>;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  seek: (ms: number) => void;
  next: () => void;
  previous: () => void;
  toggleShuffle: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPreviewRange: (range: Range | null) => void;

  stageSlot: StageSlot | null;
  pushStageSlot: (el: HTMLElement, opts?: Omit<StageSlotOptions, "enabled">) => () => void;
}

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

const VOLUME_KEY = "sportify:volume";
const MODE_KEY = "sportify:mode";
const POLL_MS = 200;

function itemTrack(item: QueueItem | null): Track | null {
  if (!item) return null;
  return item.kind === "track" ? item.track : clipToTrack(item.clip);
}

function itemRange(item: QueueItem | null): Range | null {
  if (!item || item.kind !== "clip") return null;
  return { start: item.clip.startTime, end: item.clip.endTime };
}

function describeError(code: number): string {
  if (code === 101 || code === 150) return "The video owner does not allow this video to be embedded.";
  if (code === 100) return "This video was removed or is private.";
  if (code === 2) return "Invalid video id.";
  return "YouTube could not play this video.";
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { status: authStatus } = useSession();

  const engineRef = useRef<YouTubeEngine | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [buffering, setBuffering] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [mode, setMode] = useState<Mode>("workout");
  const [isShuffle, setIsShuffleState] = useState(false);
  const [volume, setVolumeState] = useState(80);
  const [muted, setMuted] = useState(false);
  const [previewRange, setPreviewRangeState] = useState<Range | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [chillPlaylistId, setChillPlaylistIdState] = useState<string | null>(null);
  const [stageSlots, setStageSlots] = useState<StageSlot[]>([]);

  // Mirrors for callbacks that run outside React's render cycle (engine
  // events, the position poller, media session handlers).
  const queueRef = useRef<QueueItem[]>([]);
  const indexRef = useRef(-1);
  const originalQueueRef = useRef<QueueItem[]>([]);
  const previewRef = useRef<Range | null>(null);
  const statusRef = useRef<Status>("idle");
  const shuffleRef = useRef(false);
  const volumeRef = useRef(80);
  const mutedRef = useRef(false);
  const chillCacheRef = useRef<{ id: string; tracks: Track[] } | null>(null);

  const setIsShuffle = useCallback((v: boolean) => {
    shuffleRef.current = v;
    setIsShuffleState(v);
  }, []);

  const currentItem = queueIndex >= 0 ? (queue[queueIndex] ?? null) : null;
  const currentTrack = useMemo(() => itemTrack(currentItem), [currentItem]);
  const activeClip = currentItem?.kind === "clip" ? currentItem.clip : null;

  // ---------------------------------------------------------------------
  // Persisted preferences
  // ---------------------------------------------------------------------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(VOLUME_KEY);
      const v = Number(raw);
      if (raw !== null && Number.isFinite(v) && v >= 0 && v <= 100) {
        setVolumeState(v);
        volumeRef.current = v;
      }
      const m = localStorage.getItem(MODE_KEY);
      if (m === "workout" || m === "chill") setMode(m);
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, [mode]);

  // ---------------------------------------------------------------------
  // Engine lifecycle
  // ---------------------------------------------------------------------
  const applyStatus = useCallback((s: Status) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  const loadItemAt = useCallback(
    (index: number, opts?: { startMs?: number }) => {
      const item = queueRef.current[index];
      const engine = engineRef.current;
      if (!item || !engine) return;
      const track = itemTrack(item)!;
      const videoId = youtubeVideoId(track.uri);
      if (!videoId) {
        toast.error("Only YouTube tracks can be played. Recreate this clip from search.");
        return;
      }
      indexRef.current = index;
      setQueueIndex(index);
      const range = itemRange(item);
      const startMs = opts?.startMs ?? range?.start ?? 0;
      setPosition(startMs);
      setDuration(track.durationMs ?? 0);
      applyStatus("loading");
      setBuffering(true);
      engine.load(videoId, startMs, range?.end);
    },
    [applyStatus],
  );

  const nextRef = useRef<() => void>(() => {});

  const handleEngineState = useCallback(
    (s: EngineState) => {
      const engine = engineRef.current;
      switch (s) {
        case "playing":
          setBuffering(false);
          applyStatus("playing");
          if (engine) {
            const d = engine.durationMs();
            if (d > 0) setDuration(d);
          }
          break;
        case "paused":
          setBuffering(false);
          applyStatus("paused");
          break;
        case "buffering":
          setBuffering(true);
          break;
        case "ended": {
          setBuffering(false);
          const preview = previewRef.current;
          if (preview && engine) {
            engine.seek(preview.start);
            engine.play();
            return;
          }
          applyStatus("ended");
          nextRef.current();
          break;
        }
        case "cued":
        case "unstarted":
        default:
          break;
      }
    },
    [applyStatus],
  );

  const handleEngineError = useCallback((code: number) => {
    setBuffering(false);
    toast.error(describeError(code));
    // Skip past the broken item unless it was the only one.
    if (queueRef.current.length > 1) {
      window.setTimeout(() => nextRef.current(), 800);
    } else {
      statusRef.current = "idle";
      setStatus("idle");
    }
  }, []);

  const ensureEngine = useCallback(async (opts?: { silent?: boolean }): Promise<YouTubeEngine | null> => {
    if (typeof window === "undefined") return null;
    if (!engineRef.current) {
      engineRef.current = new YouTubeEngine(PLAYER_HOST_ID, {
        onReady: () => {
          setEngineReady(true);
          engineRef.current?.setVolume(volumeRef.current);
          engineRef.current?.setMuted(mutedRef.current);
        },
        onStateChange: handleEngineState,
        onError: handleEngineError,
      });
    }
    try {
      await engineRef.current.init();
      return engineRef.current;
    } catch (e) {
      console.error(e);
      if (!opts?.silent) toast.error("Could not load the YouTube player. Check your connection or ad blocker.");
      return null;
    }
  }, [handleEngineState, handleEngineError]);

  // Warm the player up as soon as we know the user is signed in so the first
  // play happens synchronously inside the click (matters for iOS autoplay).
  useEffect(() => {
    if (authStatus === "authenticated") void ensureEngine({ silent: true });
  }, [authStatus, ensureEngine]);

  useEffect(() => {
    const engine = engineRef.current;
    return () => engine?.destroy();
  }, []);

  // ---------------------------------------------------------------------
  // Position polling and clip boundary enforcement
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (status !== "playing") return;
    const id = window.setInterval(() => {
      const engine = engineRef.current;
      if (!engine) return;
      const pos = engine.positionMs();
      setPosition(pos);

      const preview = previewRef.current;
      if (preview) {
        if (pos >= preview.end || pos < preview.start - 1500) {
          engine.seek(preview.start);
        }
        return;
      }
      const item = queueRef.current[indexRef.current];
      const range = itemRange(item ?? null);
      if (range && pos >= range.end) {
        nextRef.current();
      }
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [status]);

  // ---------------------------------------------------------------------
  // Queue operations
  // ---------------------------------------------------------------------
  const replaceQueue = useCallback(
    (items: QueueItem[], startIndex: number, opts?: { startMs?: number; shuffled?: boolean }) => {
      queueRef.current = items;
      originalQueueRef.current = items;
      setQueue(items);
      setIsShuffle(Boolean(opts?.shuffled));
      void ensureEngine().then((engine) => {
        if (!engine) return;
        loadItemAt(startIndex, opts);
      });
    },
    [ensureEngine, loadItemAt, setIsShuffle],
  );

  /** Plays one track (or a list starting at it) without changing the mode. */
  const playTrack = useCallback<PlayerContextValue["playTrack"]>(
    (track, opts) => {
      const list = opts?.queue && opts.queue.length ? opts.queue : [track];
      const items: QueueItem[] = list.map((t) => ({ kind: "track", track: t }));
      const idx = Math.max(0, list.findIndex((t) => t.uri === track.uri));
      replaceQueue(items, idx, { startMs: opts?.startMs });
    },
    [replaceQueue],
  );

  const playTracks = useCallback<PlayerContextValue["playTracks"]>(
    (tracks, opts) => {
      if (!tracks.length) return;
      setMode("chill");
      const ordered = opts?.shuffle ? shuffle(tracks) : tracks;
      const items: QueueItem[] = ordered.map((t) => ({ kind: "track", track: t }));
      const idx = opts?.shuffle ? 0 : clamp(opts?.startIndex ?? 0, 0, items.length - 1);
      replaceQueue(items, idx, { shuffled: Boolean(opts?.shuffle) });
    },
    [replaceQueue],
  );

  const playClip = useCallback<PlayerContextValue["playClip"]>(
    (clip, list, opts) => {
      setMode("workout");
      const clips = (list && list.length ? list : [clip]).filter((c) => trackSource(c.trackUri) === "youtube");
      if (!clips.some((c) => c.id === clip.id)) clips.unshift(clip);
      const items: QueueItem[] = clips.map((c) => ({ kind: "clip", clip: c }));
      const idx = Math.max(0, clips.findIndex((c) => c.id === clip.id));
      replaceQueue(items, idx, { shuffled: opts?.shuffled });
    },
    [replaceQueue],
  );

  const playQueueIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= queueRef.current.length) return;
      void ensureEngine().then((engine) => engine && loadItemAt(index));
    },
    [ensureEngine, loadItemAt],
  );

  const next = useCallback(() => {
    const q = queueRef.current;
    if (!q.length) return;
    const i = indexRef.current + 1 >= q.length ? 0 : indexRef.current + 1;
    loadItemAt(i);
  }, [loadItemAt]);
  nextRef.current = next;

  const previous = useCallback(() => {
    const q = queueRef.current;
    if (!q.length) return;
    const engine = engineRef.current;
    const item = q[indexRef.current];
    const start = itemRange(item ?? null)?.start ?? 0;
    // Like most players: restart the current item unless we're near its start.
    if (engine && engine.positionMs() - start > 3000) {
      engine.seek(start);
      setPosition(start);
      return;
    }
    const i = indexRef.current - 1 < 0 ? q.length - 1 : indexRef.current - 1;
    loadItemAt(i);
  }, [loadItemAt]);

  const toggleShuffle = useCallback(() => {
    const was = shuffleRef.current;
    const q = queueRef.current;
    const current = q[indexRef.current];
    if (!current) {
      setIsShuffle(!was);
      return;
    }
    let nextQueue: QueueItem[];
    if (!was) {
      const rest = q.filter((_, i) => i !== indexRef.current);
      nextQueue = [current, ...shuffle(rest)];
    } else {
      nextQueue = originalQueueRef.current.length ? originalQueueRef.current : q;
    }
    const idx = Math.max(0, nextQueue.indexOf(current));
    queueRef.current = nextQueue;
    indexRef.current = idx;
    setQueue(nextQueue);
    setQueueIndex(idx);
    setIsShuffle(!was);
  }, [setIsShuffle]);

  // ---------------------------------------------------------------------
  // Transport
  // ---------------------------------------------------------------------
  const pause = useCallback(() => engineRef.current?.pause(), []);
  const resume = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (statusRef.current === "ended") {
      const item = queueRef.current[indexRef.current];
      engine.seek(itemRange(item ?? null)?.start ?? 0);
    }
    engine.play();
  }, []);

  const togglePlay = useCallback(() => {
    if (statusRef.current === "playing" || statusRef.current === "loading") pause();
    else resume();
  }, [pause, resume]);

  const seek = useCallback((ms: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    const item = queueRef.current[indexRef.current];
    const range = previewRef.current ?? itemRange(item ?? null);
    const target = range ? clamp(ms, range.start, range.end) : Math.max(0, ms);
    engine.seek(target);
    setPosition(target);
  }, []);

  const setVolume = useCallback((v: number) => {
    const vol = clamp(Math.round(v), 0, 100);
    volumeRef.current = vol;
    setVolumeState(vol);
    engineRef.current?.setVolume(vol);
    if (vol > 0 && mutedRef.current) {
      mutedRef.current = false;
      setMuted(false);
      engineRef.current?.setMuted(false);
    }
    try {
      localStorage.setItem(VOLUME_KEY, String(vol));
    } catch {
      /* ignore */
    }
  }, []);

  const toggleMute = useCallback(() => {
    const m = !mutedRef.current;
    mutedRef.current = m;
    setMuted(m);
    engineRef.current?.setMuted(m);
  }, []);

  const setPreviewRange = useCallback((range: Range | null) => {
    previewRef.current = range;
    setPreviewRangeState(range);
  }, []);

  // ---------------------------------------------------------------------
  // Modes
  // ---------------------------------------------------------------------
  const startWorkout = useCallback(async (): Promise<StartResult> => {
    try {
      const clips = (await api.clips.list()).filter((c) => trackSource(c.trackUri) === "youtube");
      if (!clips.length) return { ok: false, reason: "no-clips" };
      const shuffled = shuffle(clips);
      playClip(shuffled[0], shuffled, { shuffled: true });
      return { ok: true };
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not load your clips.");
      return { ok: false, reason: "error" };
    }
  }, [playClip]);

  const startChill = useCallback(async (): Promise<StartResult> => {
    if (!chillPlaylistId) return { ok: false, reason: "no-playlist" };
    try {
      let tracks = chillCacheRef.current?.id === chillPlaylistId ? chillCacheRef.current.tracks : null;
      if (!tracks) {
        const loading = toast.loading("Loading your chill playlist…");
        try {
          tracks = (await api.playlists.get(chillPlaylistId)).tracks;
          chillCacheRef.current = { id: chillPlaylistId, tracks };
        } finally {
          toast.dismiss(loading);
        }
      }
      if (!tracks.length) {
        toast.error("That playlist has no playable videos.");
        return { ok: false, reason: "error" };
      }
      playTracks(tracks, { shuffle: true });
      return { ok: true };
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not load the playlist.");
      return { ok: false, reason: "error" };
    }
  }, [chillPlaylistId, playTracks]);

  // ---------------------------------------------------------------------
  // Playlists and profile
  // ---------------------------------------------------------------------
  const loadPlaylists = useCallback(
    async (force = false) => {
      if (playlists.length && !force) return playlists;
      setPlaylistsLoading(true);
      try {
        const { playlists: list } = await api.playlists.mine();
        setPlaylists(list);
        return list;
      } catch (e) {
        toast.error(e instanceof ApiError ? e.message : "Could not load playlists.");
        return [];
      } finally {
        setPlaylistsLoading(false);
      }
    },
    [playlists],
  );

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    api.me
      .get()
      .then((me) => setChillPlaylistIdState(me.chillPlaylistId ?? null))
      .catch(() => {});
  }, [authStatus]);

  const setChillPlaylistId = useCallback(
    async (id: string | null) => {
      const prev = chillPlaylistId;
      setChillPlaylistIdState(id);
      try {
        await api.me.setChillPlaylist(id);
      } catch (e) {
        setChillPlaylistIdState(prev);
        toast.error(e instanceof ApiError ? e.message : "Could not save your chill playlist.");
      }
    },
    [chillPlaylistId],
  );

  // ---------------------------------------------------------------------
  // Stage slots: where the iframe should be drawn right now
  // ---------------------------------------------------------------------
  const pushStageSlot = useCallback((el: HTMLElement, opts?: Omit<StageSlotOptions, "enabled">) => {
    const slot: StageSlot = { el, interactive: opts?.interactive ?? false, zIndex: opts?.zIndex ?? 40 };
    setStageSlots((s) => [...s, slot]);
    return () => setStageSlots((s) => s.filter((x) => x !== slot));
  }, []);
  const stageSlot = stageSlots[stageSlots.length - 1] ?? null;

  // ---------------------------------------------------------------------
  // Media Session (lock screen / hardware keys)
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    if (currentTrack) {
      const videoId = youtubeVideoId(currentTrack.uri);
      ms.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: activeClip ? "Sportify clip" : "Sportify",
        artwork: videoId
          ? [
              { src: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`, sizes: "320x180", type: "image/jpeg" },
              { src: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, sizes: "480x360", type: "image/jpeg" },
            ]
          : [],
      });
    }
    ms.playbackState = status === "playing" ? "playing" : status === "paused" ? "paused" : "none";
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => resume()],
      ["pause", () => pause()],
      ["nexttrack", () => next()],
      ["previoustrack", () => previous()],
    ];
    for (const [action, handler] of handlers) {
      try {
        ms.setActionHandler(action, handler);
      } catch {
        /* unsupported action */
      }
    }
    return () => {
      for (const [action] of handlers) {
        try {
          ms.setActionHandler(action, null);
        } catch {
          /* ignore */
        }
      }
    };
  }, [currentTrack, activeClip, status, resume, pause, next, previous]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      engineReady,
      status,
      buffering,
      isActive: currentItem !== null,
      isPlaying: status === "playing" || status === "loading",
      currentItem,
      currentTrack,
      activeClip,
      position,
      duration,
      queue,
      queueIndex,
      mode,
      isShuffle,
      volume,
      muted,
      previewRange,
      playlists,
      playlistsLoading,
      loadPlaylists,
      chillPlaylistId,
      setChillPlaylistId,
      playTrack,
      playTracks,
      playClip,
      playQueueIndex,
      startWorkout,
      startChill,
      togglePlay,
      pause,
      resume,
      seek,
      next,
      previous,
      toggleShuffle,
      setVolume,
      toggleMute,
      setPreviewRange,
      stageSlot,
      pushStageSlot,
    }),
    [
      engineReady,
      status,
      buffering,
      currentItem,
      currentTrack,
      activeClip,
      position,
      duration,
      queue,
      queueIndex,
      mode,
      isShuffle,
      volume,
      muted,
      previewRange,
      playlists,
      playlistsLoading,
      loadPlaylists,
      chillPlaylistId,
      setChillPlaylistId,
      playTrack,
      playTracks,
      playClip,
      playQueueIndex,
      startWorkout,
      startChill,
      togglePlay,
      pause,
      resume,
      seek,
      next,
      previous,
      toggleShuffle,
      setVolume,
      toggleMute,
      setPreviewRange,
      stageSlot,
      pushStageSlot,
    ],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within a PlayerProvider");
  return ctx;
}

/**
 * Marks an element as the place the video should be drawn while it is mounted.
 * The most recently mounted slot wins, so a full-screen page or a modal can
 * take over from the mini player and hand it back on unmount.
 */
export function useStageSlot(ref: React.RefObject<HTMLElement | null>, opts: StageSlotOptions = {}) {
  const { pushStageSlot } = usePlayer();
  const { interactive = false, enabled = true, zIndex = 40 } = opts;
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    return pushStageSlot(el, { interactive, zIndex });
  }, [ref, interactive, enabled, zIndex, pushStageSlot]);
}
