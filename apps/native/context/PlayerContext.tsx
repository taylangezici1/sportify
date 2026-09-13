import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import type { View } from "react-native";
import type { Clip, PlaylistSummary, Track } from "@repo/ui";
import { clamp, clipToTrack, shuffle, trackSource, youtubeVideoId } from "@repo/ui";
import type { YouTubeErrorCode, YouTubeState, YouTubeWebPlayerHandle } from "@/components/youtube/YouTubeWebPlayer";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "./AuthContext";

/**
 * Playback state machine for the phone app. Mirrors apps/web's PlayerContext:
 * a queue of clips or tracks, workout / chill modes, a preview loop for the
 * clipper, and "stage slots" that say where the single YouTube WebView should
 * be drawn. The WebView itself lives in components/PlayerStage and is driven
 * through `playerRef`.
 */

export type Mode = "workout" | "chill";
export type Status = "idle" | "loading" | "playing" | "paused" | "ended";
export type QueueItem = { kind: "track"; track: Track } | { kind: "clip"; clip: Clip };
export interface Range {
  start: number;
  end: number;
}
export interface StageSlot {
  ref: RefObject<View | null>;
  interactive: boolean;
  /** Image drawn over the video (mini player: hides YouTube's own overlay at tiny sizes). */
  coverUri?: string;
}
export type StartResult = { ok: true } | { ok: false; reason: "no-clips" | "no-playlist" | "error"; message?: string };
export type PlayerEvent = YouTubeState;

export interface PlayerContextValue {
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
  lastError: string | null;

  playlists: PlaylistSummary[];
  playlistsLoading: boolean;
  loadPlaylists: (force?: boolean) => Promise<PlaylistSummary[]>;

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

  // Stage plumbing
  stageSlot: StageSlot | null;
  playerRef: RefObject<YouTubeWebPlayerHandle | null>;
  pushStageSlot: (slot: StageSlot) => () => void;
  onPlayerEvent: (event: PlayerEvent) => void;
  onPlayerError: (error: YouTubeErrorCode) => void;
  onPlayerReady: () => void;
}

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);
const POLL_MS = 250;

function itemTrack(item: QueueItem | null): Track | null {
  if (!item) return null;
  return item.kind === "track" ? item.track : clipToTrack(item.clip);
}
function itemRange(item: QueueItem | null): Range | null {
  if (!item || item.kind !== "clip") return null;
  return { start: item.clip.startTime, end: item.clip.endTime };
}
function describeError(code: YouTubeErrorCode): string {
  switch (code) {
    case "embed_not_allowed":
      return "The video owner does not allow this video to be embedded.";
    case "video_not_found":
      return "This video was removed or is private.";
    case "invalid_parameter":
      return "Invalid video id.";
    default:
      return "YouTube could not play this video.";
  }
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { status: authStatus, user } = useAuth();
  const playerRef = useRef<YouTubeWebPlayerHandle | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [buffering, setBuffering] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [mode, setMode] = useState<Mode>("workout");
  const [isShuffle, setIsShuffleState] = useState(false);
  const [volume, setVolumeState] = useState(100);
  const [muted, setMuted] = useState(false);
  const [previewRange, setPreviewRangeState] = useState<Range | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [stageSlots, setStageSlots] = useState<StageSlot[]>([]);

  const queueRef = useRef<QueueItem[]>([]);
  const indexRef = useRef(-1);
  const originalQueueRef = useRef<QueueItem[]>([]);
  const previewRef = useRef<Range | null>(null);
  const statusRef = useRef<Status>("idle");
  const shuffleRef = useRef(false);
  const loadedVideoRef = useRef<string | null>(null);
  const mutedRef = useRef(false);
  const chillCacheRef = useRef<{ id: string; tracks: Track[] } | null>(null);

  const setIsShuffle = useCallback((v: boolean) => {
    shuffleRef.current = v;
    setIsShuffleState(v);
  }, []);
  const applyStatus = useCallback((s: Status) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  const currentItem = queueIndex >= 0 ? (queue[queueIndex] ?? null) : null;
  const currentTrack = useMemo(() => itemTrack(currentItem), [currentItem]);
  const activeClip = currentItem?.kind === "clip" ? currentItem.clip : null;

  // Reset everything on sign-out.
  useEffect(() => {
    if (authStatus !== "signedOut") return;
    queueRef.current = [];
    indexRef.current = -1;
    loadedVideoRef.current = null;
    setQueue([]);
    setQueueIndex(-1);
    setPlaylists([]);
    chillCacheRef.current = null;
    applyStatus("idle");
    playerRef.current?.pause();
  }, [authStatus, applyStatus]);

  // ---------------------------------------------------------------------
  // Loading items into the player
  // ---------------------------------------------------------------------
  const loadItemAt = useCallback(
    (index: number, opts?: { startMs?: number }) => {
      const item = queueRef.current[index];
      const player = playerRef.current;
      if (!item || !player) return;
      const track = itemTrack(item)!;
      const videoId = youtubeVideoId(track.uri);
      if (!videoId) {
        setLastError("Only YouTube tracks can be played on the phone.");
        return;
      }
      indexRef.current = index;
      setQueueIndex(index);
      const range = itemRange(item);
      const startMs = opts?.startMs ?? range?.start ?? 0;
      setPosition(startMs);
      setDuration(track.durationMs ?? 0);
      setLastError(null);
      applyStatus("loading");
      setBuffering(true);
      loadedVideoRef.current = videoId;
      // One call carries the window: YouTube buffers straight at the clip start
      // and raises "ended" at the clip end on its own.
      player.load(videoId, {
        startSeconds: startMs / 1000,
        endSeconds: range ? range.end / 1000 : undefined,
        autoplay: true,
      });
    },
    [applyStatus],
  );

  const nextRef = useRef<() => void>(() => {});

  const onPlayerReady = useCallback(() => {
    playerRef.current?.setMuted(mutedRef.current);
  }, []);

  const onPlayerEvent = useCallback(
    (event: PlayerEvent) => {
      const player = playerRef.current;
      switch (event) {
        case "playing":
          setBuffering(false);
          applyStatus("playing");
          player
            ?.getDuration()
            .then((s) => Number.isFinite(s) && s > 0 && setDuration(s * 1000))
            .catch(() => {});
          break;
        case "paused":
          setBuffering(false);
          if (statusRef.current !== "loading") applyStatus("paused");
          break;
        case "buffering":
          setBuffering(true);
          break;
        case "ended": {
          setBuffering(false);
          const preview = previewRef.current;
          if (preview && player) {
            player.seekTo(preview.start / 1000);
            player.play();
            return;
          }
          applyStatus("ended");
          nextRef.current();
          break;
        }
        default:
          break;
      }
    },
    [applyStatus],
  );

  const onPlayerError = useCallback((code: YouTubeErrorCode) => {
    setBuffering(false);
    setLastError(describeError(code));
    if (queueRef.current.length > 1) setTimeout(() => nextRef.current(), 800);
    else {
      statusRef.current = "idle";
      setStatus("idle");
    }
  }, []);

  // ---------------------------------------------------------------------
  // Position polling, clip boundary fallback, clipper preview loop
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (status !== "playing") return;
    let cancelled = false;
    const tick = async () => {
      const player = playerRef.current;
      if (!player) return;
      const seconds = await player.getCurrentTime().catch(() => NaN);
      if (cancelled || !Number.isFinite(seconds)) return;
      const pos = seconds * 1000;
      setPosition(pos);

      const preview = previewRef.current;
      if (preview) {
        if (pos >= preview.end || pos < preview.start - 1500) player.seekTo(preview.start / 1000);
        return;
      }
      const range = itemRange(queueRef.current[indexRef.current] ?? null);
      if (range && pos >= range.end + 250) nextRef.current();
    };
    const id = setInterval(() => void tick(), POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
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
      loadItemAt(startIndex, opts);
    },
    [loadItemAt, setIsShuffle],
  );

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
      if (index >= 0 && index < queueRef.current.length) loadItemAt(index);
    },
    [loadItemAt],
  );

  const next = useCallback(() => {
    const q = queueRef.current;
    if (!q.length) return;
    loadItemAt(indexRef.current + 1 >= q.length ? 0 : indexRef.current + 1);
  }, [loadItemAt]);
  nextRef.current = next;

  const previous = useCallback(() => {
    const q = queueRef.current;
    if (!q.length) return;
    const start = itemRange(q[indexRef.current] ?? null)?.start ?? 0;
    const goBack = () => loadItemAt(indexRef.current - 1 < 0 ? q.length - 1 : indexRef.current - 1);
    const player = playerRef.current;
    if (!player) return goBack();
    player
      .getCurrentTime()
      .then((s) => {
        // Like most players: restart the current item unless we're near its start.
        if (Number.isFinite(s) && s * 1000 - start > 3000) {
          player.seekTo(start / 1000);
          setPosition(start);
        } else {
          goBack();
        }
      })
      .catch(goBack);
  }, [loadItemAt]);

  const toggleShuffle = useCallback(() => {
    const was = shuffleRef.current;
    const q = queueRef.current;
    const current = q[indexRef.current];
    if (!current) {
      setIsShuffle(!was);
      return;
    }
    const nextQueue = !was
      ? [current, ...shuffle(q.filter((_, i) => i !== indexRef.current))]
      : originalQueueRef.current.length
        ? originalQueueRef.current
        : q;
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
  const pause = useCallback(() => playerRef.current?.pause(), []);
  const resume = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (statusRef.current === "ended") {
      player.seekTo((itemRange(queueRef.current[indexRef.current] ?? null)?.start ?? 0) / 1000);
    }
    player.play();
  }, []);
  const togglePlay = useCallback(() => {
    if (statusRef.current === "playing" || statusRef.current === "loading") pause();
    else resume();
  }, [pause, resume]);

  const seek = useCallback((ms: number) => {
    const range = previewRef.current ?? itemRange(queueRef.current[indexRef.current] ?? null);
    const target = range ? clamp(ms, range.start, range.end) : Math.max(0, ms);
    playerRef.current?.seekTo(target / 1000);
    setPosition(target);
  }, []);

  const setVolume = useCallback((v: number) => {
    const vol = clamp(Math.round(v), 0, 100);
    setVolumeState(vol);
    mutedRef.current = false;
    setMuted(false);
    playerRef.current?.setVolume(vol);
    playerRef.current?.setMuted(false);
  }, []);
  const toggleMute = useCallback(() => {
    const m = !mutedRef.current;
    mutedRef.current = m;
    setMuted(m);
    playerRef.current?.setMuted(m);
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
      return { ok: false, reason: "error", message: e instanceof ApiError ? e.message : "Could not load your clips." };
    }
  }, [playClip]);

  const chillPlaylistId = user?.chillPlaylistId ?? null;
  const startChill = useCallback(async (): Promise<StartResult> => {
    if (!chillPlaylistId) return { ok: false, reason: "no-playlist" };
    try {
      let tracks = chillCacheRef.current?.id === chillPlaylistId ? chillCacheRef.current.tracks : null;
      if (!tracks) {
        tracks = (await api.playlists.get(chillPlaylistId)).tracks;
        chillCacheRef.current = { id: chillPlaylistId, tracks };
      }
      if (!tracks.length) return { ok: false, reason: "error", message: "That playlist has no playable videos." };
      playTracks(tracks, { shuffle: true });
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: "error", message: e instanceof ApiError ? e.message : "Could not load the playlist." };
    }
  }, [chillPlaylistId, playTracks]);

  const loadPlaylists = useCallback(
    async (force = false) => {
      if (playlists.length && !force) return playlists;
      setPlaylistsLoading(true);
      try {
        const { playlists: list } = await api.playlists.mine();
        setPlaylists(list);
        return list;
      } catch (e) {
        setLastError(e instanceof ApiError ? e.message : "Could not load playlists.");
        return [];
      } finally {
        setPlaylistsLoading(false);
      }
    },
    [playlists],
  );

  // ---------------------------------------------------------------------
  // Stage slots
  // ---------------------------------------------------------------------
  const pushStageSlot = useCallback((slot: StageSlot) => {
    setStageSlots((s) => [...s, slot]);
    return () => setStageSlots((s) => s.filter((x) => x !== slot));
  }, []);
  const stageSlot = stageSlots[stageSlots.length - 1] ?? null;

  const value = useMemo<PlayerContextValue>(
    () => ({
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
      lastError,
      playlists,
      playlistsLoading,
      loadPlaylists,
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
      playerRef,
      pushStageSlot,
      onPlayerEvent,
      onPlayerError,
      onPlayerReady,
    }),
    [
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
      lastError,
      playlists,
      playlistsLoading,
      loadPlaylists,
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
      onPlayerEvent,
      onPlayerError,
      onPlayerReady,
    ],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

/** Registers a View as the place the video is drawn while mounted. Last one wins. */
export function useStageSlot(
  ref: RefObject<View | null>,
  opts: { interactive?: boolean; enabled?: boolean; coverUri?: string } = {},
) {
  const { pushStageSlot } = usePlayer();
  const { interactive = false, enabled = true, coverUri } = opts;
  useEffect(() => {
    if (!enabled) return;
    return pushStageSlot({ ref, interactive, coverUri });
  }, [ref, interactive, enabled, coverUri, pushStageSlot]);
}
