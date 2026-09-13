import React, { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import YoutubePlayer, { PLAYER_STATES } from "react-native-youtube-iframe";
import { usePlayer, type PlayerEvent, type StageSlot } from "@/context/PlayerContext";
import { colors } from "@/lib/theme";

type Rect = { x: number; y: number; w: number; h: number };
const OFFSCREEN: Rect = { x: -2000, y: -2000, w: 320, h: 180 };

/**
 * The player page the library loads (its author's GitHub Pages) only *reports*
 * events; it has no listener for the commands the library posts for the
 * play / mute / volume props, so pause never reached YouTube. This script,
 * injected after the page loads, adds that listener. The page declares the
 * YouTube player as a global `player`. iOS delivers postMessage on window,
 * Android on document, so both are covered.
 */
const COMMAND_BRIDGE = `
(function () {
  if (window.__sportifyBridge) return;
  window.__sportifyBridge = true;
  function handle(event) {
    try {
      var msg = JSON.parse(event.data);
      var p = window.player;
      if (!p || !msg || !msg.eventName) return;
      switch (msg.eventName) {
        case "playVideo": p.playVideo(); break;
        case "pauseVideo": p.pauseVideo(); break;
        case "muteVideo": p.mute(); break;
        case "unMuteVideo": p.unMute(); break;
        case "setVolume": if (msg.meta && typeof msg.meta.volume === "number") p.setVolume(msg.meta.volume); break;
        case "setPlaybackRate": if (msg.meta && typeof msg.meta.playbackRate === "number") p.setPlaybackRate(msg.meta.playbackRate); break;
      }
    } catch (e) {}
  }
  window.addEventListener("message", handle);
  document.addEventListener("message", handle);
})();
true;
`;

// The library reports states as plain strings at runtime ("playing", "video cued", …);
// its TypeScript enum is only a type-level convenience, so match on the text.
function mapState(s: PLAYER_STATES | string): PlayerEvent {
  switch (String(s).toLowerCase()) {
    case "playing":
      return "playing";
    case "paused":
      return "paused";
    case "ended":
      return "ended";
    case "buffering":
      return "buffering";
    case "video cued":
    case "cued":
      return "cued";
    default:
      return "unstarted";
  }
}

/**
 * The one YouTube WebView for the whole app. It is mounted once in the root
 * layout and positioned over whichever slot View is currently registered
 * (mini player thumbnail, Now Playing hero, clipper preview), because moving
 * a WebView between parents would reload the video.
 */
export default function PlayerStage() {
  const { stage, stageSlot, isActive, playerRef, onPlayerEvent, onPlayerError, onPlayerReady } = usePlayer();
  // Measured rect is tagged with the slot it belongs to, so a stale value from
  // a previous slot is never applied to the next one.
  const [measured, setMeasured] = useState<{ slot: StageSlot; rect: Rect } | null>(null);

  useEffect(() => {
    if (!stageSlot) return;
    let last = "";
    const measure = () => {
      stageSlot.ref.current?.measureInWindow((x, y, w, h) => {
        if (!(w > 0 && h > 0)) return;
        const key = `${Math.round(x)}|${Math.round(y)}|${Math.round(w)}|${Math.round(h)}`;
        if (key === last) return;
        last = key;
        setMeasured({ slot: stageSlot, rect: { x, y, w, h } });
      });
    };
    measure();
    const id = setInterval(measure, 120);
    return () => clearInterval(id);
  }, [stageSlot]);

  const rect = stageSlot && measured?.slot === stageSlot ? measured.rect : OFFSCREEN;
  const visible = Boolean(stageSlot) && isActive && rect !== OFFSCREEN;
  useEffect(() => {
    if (__DEV__) console.log("[stage] props", { videoId: stage.videoId, play: stage.play, slot: Boolean(stageSlot), visible });
  }, [stage.videoId, stage.play, stageSlot, visible]);

  return (
    <View
      pointerEvents={stageSlot?.interactive ? "auto" : "none"}
      style={[
        styles.stage,
        {
          left: rect.x,
          top: rect.y,
          width: rect.w,
          height: rect.h,
          opacity: visible ? 1 : 0,
        },
      ]}
    >
      <YoutubePlayer
        ref={playerRef}
        height={rect.h}
        width={rect.w}
        videoId={stage.videoId}
        play={stage.play}
        volume={stage.volume}
        mute={stage.muted}
        forceAndroidAutoplay
        initialPlayerParams={{ controls: false, rel: false, preventFullScreen: true, iv_load_policy: 3 }}
        webViewProps={{
          allowsInlineMediaPlayback: true,
          mediaPlaybackRequiresUserAction: false,
          injectedJavaScript: COMMAND_BRIDGE,
        }}
        webViewStyle={{ backgroundColor: colors.black }}
        onReady={() => {
          if (__DEV__) console.log("[stage] ready");
          onPlayerReady();
        }}
        onChangeState={(s: PLAYER_STATES | string) => {
          if (__DEV__) console.log("[stage] state", s);
          onPlayerEvent(mapState(s));
        }}
        onError={(e: string) => {
          if (__DEV__) console.log("[stage] error", e);
          onPlayerError(e);
        }}
      />
      {stageSlot?.coverUri && (
        <Image source={{ uri: stageSlot.coverUri }} style={styles.cover} resizeMode="cover" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  stage: {
    position: "absolute",
    overflow: "hidden",
    backgroundColor: colors.black,
    borderRadius: 12,
    zIndex: 50,
    elevation: 50,
  },
});
