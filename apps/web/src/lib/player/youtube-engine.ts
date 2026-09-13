/**
 * Thin, typed wrapper around the YouTube IFrame Player API.
 *
 * The engine owns exactly one `YT.Player` bound to a host element that must
 * stay mounted for the life of the app (see PlayerStage). All times crossing
 * this boundary are milliseconds; the IFrame API itself speaks seconds.
 */

export type EngineState = "unstarted" | "ended" | "playing" | "paused" | "buffering" | "cued";

export interface EngineEvents {
  onReady: () => void;
  onStateChange: (state: EngineState) => void;
  /** YouTube error codes: 2 bad id, 5 html5 error, 100 not found, 101/150 not embeddable. */
  onError: (code: number) => void;
}

let apiPromise: Promise<typeof YT> | null = null;

/** Loads the IFrame API script once and resolves with the `YT` namespace. */
export function loadIframeApi(): Promise<typeof YT> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<typeof YT>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
      else reject(new Error("YT namespace missing after API ready"));
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      reject(new Error("Failed to load the YouTube IFrame API"));
    };
    document.head.appendChild(script);
  });
  return apiPromise;
}

function mapState(code: number): EngineState {
  switch (code) {
    case YT.PlayerState.ENDED:
      return "ended";
    case YT.PlayerState.PLAYING:
      return "playing";
    case YT.PlayerState.PAUSED:
      return "paused";
    case YT.PlayerState.BUFFERING:
      return "buffering";
    case YT.PlayerState.CUED:
      return "cued";
    default:
      return "unstarted";
  }
}

export class YouTubeEngine {
  private player: YT.Player | null = null;
  private readyFlag = false;
  private initPromise: Promise<void> | null = null;

  constructor(
    private readonly hostId: string,
    private readonly events: EngineEvents,
  ) {}

  get isReady(): boolean {
    return this.readyFlag;
  }

  /**
   * The host div lives in the app shell, which is not rendered on public pages
   * (login, the mobile hand-off). Wait for it instead of failing.
   */
  private waitForHost(timeoutMs = 30_000): Promise<void> {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const check = () => {
        if (document.getElementById(this.hostId)) return resolve();
        if (Date.now() - started > timeoutMs) return reject(new Error(`Player host #${this.hostId} is not mounted`));
        window.setTimeout(check, 250);
      };
      check();
    });
  }

  /** Creates the player inside the host element. Safe to call repeatedly. */
  init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      const api = await loadIframeApi();
      await this.waitForHost();

      await new Promise<void>((resolve) => {
        this.player = new api.Player(this.hostId, {
          width: "100%",
          height: "100%",
          host: "https://www.youtube-nocookie.com",
          playerVars: {
            playsinline: 1,
            controls: 0,
            disablekb: 1,
            rel: 0,
            iv_load_policy: 3,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              this.readyFlag = true;
              this.events.onReady();
              resolve();
            },
            onStateChange: (e) => this.events.onStateChange(mapState(e.data)),
            onError: (e) => this.events.onError(Number(e.data)),
          },
        });
      });
    })();
    this.initPromise.catch(() => {
      this.initPromise = null;
    });
    return this.initPromise;
  }

  /** Loads and starts a video. `endMs` makes YouTube stop at that point on its own. */
  load(videoId: string, startMs = 0, endMs?: number): void {
    this.player?.loadVideoById({
      videoId,
      startSeconds: Math.max(0, startMs / 1000),
      endSeconds: endMs && endMs > startMs ? endMs / 1000 : undefined,
    });
  }

  play(): void {
    this.player?.playVideo();
  }

  pause(): void {
    this.player?.pauseVideo();
  }

  stop(): void {
    this.player?.stopVideo();
  }

  seek(ms: number): void {
    this.player?.seekTo(Math.max(0, ms / 1000), true);
  }

  positionMs(): number {
    const s = this.player?.getCurrentTime?.();
    return typeof s === "number" && Number.isFinite(s) ? s * 1000 : 0;
  }

  durationMs(): number {
    const s = this.player?.getDuration?.();
    return typeof s === "number" && Number.isFinite(s) ? s * 1000 : 0;
  }

  currentVideoId(): string | null {
    const p = this.player as unknown as { getVideoData?: () => { video_id?: string } } | null;
    const data = p?.getVideoData?.();
    return data?.video_id ?? null;
  }

  /** 0 to 100. */
  setVolume(volume: number): void {
    this.player?.setVolume(Math.round(Math.min(100, Math.max(0, volume))));
  }

  setMuted(muted: boolean): void {
    if (muted) this.player?.mute();
    else this.player?.unMute();
  }

  destroy(): void {
    this.player?.destroy();
    this.player = null;
    this.readyFlag = false;
    this.initPromise = null;
  }
}
