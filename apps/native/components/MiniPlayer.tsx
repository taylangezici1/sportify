import React, { useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { youtubeThumbnail, youtubeVideoId } from "@repo/ui";
import { usePlayer, useStageSlot } from "@/context/PlayerContext";
import { colors, fonts } from "@/lib/theme";
import ProgressBar from "./ProgressBar";
import TransportControls from "./TransportControls";

/** Sits between the tab content and the tab bar while something is loaded. */
export default function MiniPlayer() {
  const { isActive, currentTrack, activeClip, position, duration, mode } = usePlayer();
  const router = useRouter();
  const slotRef = useRef<View>(null);
  const videoId = currentTrack ? youtubeVideoId(currentTrack.uri) : null;
  const coverUri = currentTrack?.imageUrl ?? (videoId ? youtubeThumbnail(videoId) : undefined);
  useStageSlot(slotRef, { enabled: isActive, coverUri });

  if (!isActive || !currentTrack) return null;

  const rangeStart = activeClip?.startTime ?? 0;
  const rangeEnd = activeClip?.endTime ?? (duration || currentTrack.durationMs || 1);
  const color = mode === "workout" ? colors.workout : colors.chill;

  return (
    <View style={styles.wrap}>
      <View style={styles.progress} pointerEvents="none">
        <ProgressBar position={position} rangeStart={rangeStart} rangeEnd={rangeEnd} color={color} thin />
      </View>
      <View style={styles.row}>
        <Pressable style={styles.info} onPress={() => router.push("/player")} accessibilityLabel="Open now playing">
          <View ref={slotRef} style={styles.slot} collapsable={false} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.title} numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name={mode === "workout" ? "flame" : "snow"} size={11} color={color} />
              <Text style={styles.artist} numberOfLines={1}>
                {currentTrack.artist || "YouTube"}
              </Text>
            </View>
          </View>
        </Pressable>
        <TransportControls size="sm" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line },
  progress: { position: "absolute", left: 0, right: 0, top: -6, zIndex: 1 },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, height: 64, gap: 8 },
  info: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, minWidth: 0 },
  slot: { width: 78, height: 44, borderRadius: 6, backgroundColor: colors.surface3, overflow: "hidden" },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 14 },
  artist: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, flexShrink: 1 },
});
