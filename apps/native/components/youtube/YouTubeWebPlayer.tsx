import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView, type WebViewMessageEvent, type WebViewNavigation } from "react-native-webview";

/**
 * A minimal YouTube IFrame player inside a WebView, driven imperatively.
 *
 * Derived from react-native-youtube-iframe (MIT). We keep its hosted player
 * page, because YouTube refuses embeds that lack a real HTTP referrer and a
 * local HTML string has none, but talk to the page ourselves:
 *
 *  - commands are injected JavaScript against the page's global `player`
 *  - events arrive through `window.ReactNativeWebView.postMessage`
 *  - loads carry start/end seconds, so a clip starts buffering at its start
 *    instead of loading from zero and seeking (one buffer instead of two)
 */

const PLAYER_PAGE = "https://lonelycpp.github.io/react-native-youtube-iframe/iframe.html";

/** Desktop UA makes Android's WebView allow autoplay without a tap. */
const ANDROID_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36";

export type YouTubeState = "unstarted" | "ended" | "playing" | "paused" | "buffering" | "cued";
export type YouTubeErrorCode = "invalid_parameter" | "html5_error" | "video_not_found" | "embed_not_allowed" | "unknown";

const STATES: Record<string, YouTubeState> = {
  "-1": "unstarted",
  "0": "ended",
  "1": "playing",
  "2": "paused",
  "3": "buffering",
  "5": "cued",
};
const ERRORS: Record<string, YouTubeErrorCode> = {
  "2": "invalid_parameter",
  "5": "html5_error",
  "100": "video_not_found",
  "101": "embed_not_allowed",
  "150": "embed_not_allowed",
};

export interface YouTubeWebPlayerHandle {
  /** Loads a video and starts it (or cues it) at `startSeconds`; `endSeconds` stops it there. */
  load: (videoId: string, opts?: { startSeconds?: number; endSeconds?: number; autoplay?: boolean }) => void;
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  getCurrentTime: () => Promise<number>;
  getDuration: () => Promise<number>;
}

interface Props {
  width: number;
  height: number;
  onReady?: () => void;
  onStateChange?: (state: YouTubeState) => void;
  onError?: (code: YouTubeErrorCode) => void;
}

function pageUrl() {
  // Keys mirror what the hosted page expects (see the library's MAIN_SCRIPT).
  const data = {
    videoId_s: "",
    controls_s: 0,
    rel_s: 0,
    loop_s: 0,
    preventFullScreen_s: 0,
    iv_load_policy: 3,
    contentScale_s: 1,
    allowWebViewZoom: false,
    modestbranding_s: 1,
    showClosedCaptions_s: 0,
    cc_lang_pref_s: "",
  };
  return `${PLAYER_PAGE}?data=${encodeURI(JSON.stringify(data))}`;
}

const YouTubeWebPlayer = forwardRef<YouTubeWebPlayerHandle, Props>(function YouTubeWebPlayer(
  { width, height, onReady, onStateChange, onError },
  ref,
) {
  const webViewRef = useRef<WebView>(null);
  const readyRef = useRef(false);
  const queueRef = useRef<string[]>([]);
  const pendingRef = useRef(new Map<string, (value: number) => void>());
  const requestIdRef = useRef(0);
  const [source] = useState(() => ({ uri: pageUrl() }));

  const run = useCallback((js: string) => {
    const script = `try { ${js} } catch (e) {} true;`;
    if (!readyRef.current) {
      queueRef.current.push(script);
      return;
    }
    webViewRef.current?.injectJavaScript(script);
  }, []);

  const query = useCallback(
    (expression: string): Promise<number> =>
      new Promise((resolve) => {
        const id = `q${++requestIdRef.current}`;
        pendingRef.current.set(id, resolve);
        run(
          `window.ReactNativeWebView.postMessage(JSON.stringify({eventType: "query", id: ${JSON.stringify(id)}, data: ${expression}}));`,
        );
        // Never leave a caller hanging if the page reloads mid-request.
        setTimeout(() => {
          if (pendingRef.current.delete(id)) resolve(NaN);
        }, 2000);
      }),
    [run],
  );

  useImperativeHandle(
    ref,
    () => ({
      load: (videoId, opts) => {
        const fn = opts?.autoplay === false ? "cueVideoById" : "loadVideoById";
        const args: Record<string, unknown> = { videoId };
        if (opts?.startSeconds && opts.startSeconds > 0) args.startSeconds = opts.startSeconds;
        if (opts?.endSeconds && opts.endSeconds > 0) args.endSeconds = opts.endSeconds;
        run(`player.${fn}(${JSON.stringify(args)});`);
      },
      play: () => run("player.playVideo();"),
      pause: () => run("player.pauseVideo();"),
      seekTo: (seconds) => run(`player.seekTo(${Math.max(0, seconds)}, true);`),
      setVolume: (volume) => run(`player.setVolume(${Math.round(Math.min(100, Math.max(0, volume)))});`),
      setMuted: (muted) => run(muted ? "player.mute();" : "player.unMute();"),
      getCurrentTime: () => query("player.getCurrentTime()"),
      getDuration: () => query("player.getDuration()"),
    }),
    [run, query],
  );

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let message: { eventType?: string; id?: string; data?: unknown };
      try {
        message = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }
      switch (message.eventType) {
        case "playerReady": {
          readyRef.current = true;
          const queued = queueRef.current.splice(0);
          queued.forEach((js) => webViewRef.current?.injectJavaScript(js));
          onReady?.();
          break;
        }
        case "playerStateChange":
          onStateChange?.(STATES[String(message.data)] ?? "unstarted");
          break;
        case "playerError":
          onError?.(ERRORS[String(message.data)] ?? "unknown");
          break;
        case "query": {
          const resolve = message.id ? pendingRef.current.get(message.id) : undefined;
          if (message.id && resolve) {
            pendingRef.current.delete(message.id);
            resolve(typeof message.data === "number" ? message.data : Number(message.data));
          }
          break;
        }
        default:
          break;
      }
    },
    [onReady, onStateChange, onError],
  );

  // iOS runs this for iframe loads too (the YouTube embed itself), so only the
  // top frame is pinned to the player page; sub-frames may load anything.
  const onShouldStartLoadWithRequest = useCallback((req: WebViewNavigation & { isTopFrame?: boolean }) => {
    if (req.isTopFrame === false) return true;
    return req.url.startsWith(PLAYER_PAGE);
  }, []);

  const userAgent = useMemo(() => (Platform.OS === "android" ? ANDROID_USER_AGENT : undefined), []);

  return (
    <View style={{ width, height }}>
      <WebView
        ref={webViewRef}
        source={source}
        style={styles.webView}
        bounces={false}
        originWhitelist={["*"]}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo={false}
        userAgent={userAgent}
        onMessage={onMessage}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        // The page never needs to reload; if it does (crash), commands queue until it is ready again.
        onLoadStart={() => {
          readyRef.current = false;
        }}
      />
    </View>
  );
});

export default YouTubeWebPlayer;

const styles = StyleSheet.create({
  webView: { flex: 1, backgroundColor: "#000" },
});
