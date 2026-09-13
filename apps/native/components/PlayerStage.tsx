import React, { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { usePlayer, type StageSlot } from "@/context/PlayerContext";
import { colors } from "@/lib/theme";
import YouTubeWebPlayer from "./youtube/YouTubeWebPlayer";

type Rect = { x: number; y: number; w: number; h: number };
const OFFSCREEN: Rect = { x: -2000, y: -2000, w: 320, h: 180 };

/**
 * The one YouTube WebView for the whole app. It is mounted once in the root
 * layout and positioned over whichever slot View is currently registered
 * (mini player thumbnail, Now Playing hero, clipper preview), because moving
 * a WebView between parents would reload the video.
 */
export default function PlayerStage() {
  const { stageSlot, isActive, playerRef, onPlayerEvent, onPlayerError, onPlayerReady } = usePlayer();
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

  return (
    <View
      pointerEvents={stageSlot?.interactive ? "auto" : "none"}
      style={[styles.stage, { left: rect.x, top: rect.y, width: rect.w, height: rect.h, opacity: visible ? 1 : 0 }]}
    >
      <YouTubeWebPlayer
        ref={playerRef}
        width={rect.w}
        height={rect.h}
        onReady={() => {
          if (__DEV__) console.log("[stage] ready");
          onPlayerReady();
        }}
        onStateChange={(s) => {
          if (__DEV__) console.log("[stage] state", s);
          onPlayerEvent(s);
        }}
        onError={(e) => {
          if (__DEV__) console.log("[stage] error", e);
          onPlayerError(e);
        }}
      />
      {stageSlot?.coverUri && <Image source={{ uri: stageSlot.coverUri }} style={styles.cover} resizeMode="cover" />}
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
