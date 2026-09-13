import React, { useRef } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { formatTime, youtubeThumbnail, youtubeVideoId } from "@repo/ui";
import { usePlayer, useStageSlot, type QueueItem } from "@/context/PlayerContext";
import { colors, fonts, radius, space } from "@/lib/theme";
import ModeSwitch from "@/components/ModeSwitch";
import ProgressBar from "@/components/ProgressBar";
import TransportControls from "@/components/TransportControls";
import { Badge, EmptyState, IconButton, Thumb } from "@/components/ui";

function itemTitle(item: QueueItem) {
  return item.kind === "clip" ? item.clip.trackName : item.track.title;
}
function itemSub(item: QueueItem) {
  return item.kind === "clip" ? `${formatTime(item.clip.startTime)} – ${formatTime(item.clip.endTime)}` : item.track.artist;
}
function itemImage(item: QueueItem) {
  if (item.kind === "track") return item.track.imageUrl;
  const id = youtubeVideoId(item.clip.trackUri);
  return item.clip.imageUrl ?? (id ? youtubeThumbnail(id) : undefined);
}

export default function PlayerScreen() {
  const router = useRouter();
  const { isActive, currentTrack, activeClip, position, duration, seek, mode, queue, queueIndex, playQueueIndex, lastError } = usePlayer();
  const heroRef = useRef<View>(null);
  useStageSlot(heroRef, { interactive: true, enabled: isActive });

  const rangeStart = activeClip?.startTime ?? 0;
  const rangeEnd = activeClip?.endTime ?? (duration || currentTrack?.durationMs || 1);
  const color = mode === "workout" ? colors.workout : colors.chill;
  const upNext = queue.slice(queueIndex + 1, queueIndex + 26);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <IconButton name="chevron-down" label="Close" size={40} color={colors.text} onPress={() => router.back()} />
        <Text style={styles.kicker}>NOW PLAYING</Text>
        <View style={{ width: 40 }} />
      </View>

      {!isActive || !currentTrack ? (
        <View style={{ padding: space.lg }}>
          <EmptyState icon="musical-notes" title="Nothing playing" description="Start a workout, chill with a playlist, or pick a track from search." action={<ModeSwitch />} />
        </View>
      ) : (
        <FlatList
          data={upNext}
          keyExtractor={(item, i) => `${queueIndex + 1 + i}-${itemTitle(item)}`}
          contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.xxl }}
          ListHeaderComponent={
            <View>
              <View ref={heroRef} collapsable={false} style={styles.hero} />
              <View style={styles.badges}>
                <Badge tone={mode}>{mode === "workout" ? "Workout" : "Chill"}</Badge>
                {activeClip && (
                  <Badge>
                    {formatTime(activeClip.startTime)} – {formatTime(activeClip.endTime)}
                  </Badge>
                )}
              </View>
              <Text style={styles.title} numberOfLines={2}>
                {currentTrack.title}
              </Text>
              <Text style={styles.artist} numberOfLines={1}>
                {currentTrack.artist || "YouTube"}
              </Text>
              {lastError && <Text style={styles.error}>{lastError}</Text>}

              <View style={{ marginTop: space.md }}>
                <ProgressBar position={position} rangeStart={rangeStart} rangeEnd={rangeEnd} onSeek={seek} color={color} showTimes />
              </View>
              <View style={{ marginTop: space.md, alignItems: "center", gap: space.lg }}>
                <TransportControls size="lg" />
                <ModeSwitch compact />
              </View>

              <View style={styles.upNextHead}>
                <Text style={styles.upNextTitle}>UP NEXT</Text>
                <Text style={styles.upNextCount}>
                  {queueIndex + 1} / {queue.length}
                </Text>
              </View>
              {upNext.length === 0 && <Text style={styles.endNote}>End of queue. It loops back to the start.</Text>}
            </View>
          }
          renderItem={({ item, index }) => (
            <Pressable onPress={() => playQueueIndex(queueIndex + 1 + index)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
              <Thumb uri={itemImage(item)} height={40} rounded={6} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {itemTitle(item)}
                </Text>
                <Text style={styles.rowSub} numberOfLines={1}>
                  {itemSub(item)}
                </Text>
              </View>
              <Ionicons name="play" size={16} color={colors.subtle} />
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: space.md, paddingVertical: space.sm },
  kicker: { color: colors.muted, fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.5 },
  hero: { width: "100%", aspectRatio: 16 / 9, borderRadius: radius.lg, backgroundColor: colors.black, overflow: "hidden" },
  badges: { flexDirection: "row", gap: 6, marginTop: space.lg },
  title: { color: colors.text, fontFamily: fonts.black, fontSize: 22, lineHeight: 26, marginTop: 8 },
  artist: { color: colors.muted, fontFamily: fonts.regular, fontSize: 14, marginTop: 2 },
  error: { color: colors.danger, fontFamily: fonts.regular, fontSize: 12, marginTop: 6 },
  upNextHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: space.xl, marginBottom: 6 },
  upNextTitle: { color: colors.muted, fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.5 },
  upNextCount: { color: colors.subtle, fontFamily: fonts.mono, fontSize: 11 },
  endNote: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, padding: space.md, borderWidth: 1, borderStyle: "dashed", borderColor: colors.line, borderRadius: radius.md },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  rowTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 14 },
  rowSub: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12 },
});
