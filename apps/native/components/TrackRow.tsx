import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Track } from "@repo/ui";
import { formatTime } from "@repo/ui";
import { colors, fonts } from "@/lib/theme";
import { Button, Thumb } from "./ui";

interface TrackRowProps {
  track: Track;
  index?: number;
  current?: boolean;
  playing?: boolean;
  onPress: () => void;
  onClip: () => void;
}

export default function TrackRow({ track, index, current, playing, onPress, onClip }: TrackRowProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, current && styles.rowCurrent, pressed && { opacity: 0.8 }]}>
      {index !== undefined && <Text style={styles.index}>{index + 1}</Text>}
      <View>
        <Thumb uri={track.imageUrl} height={48} />
        {current && (
          <View style={styles.overlay}>
            <Ionicons name={playing ? "pause" : "play"} size={20} color="#fff" />
          </View>
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.title, current && { color: colors.chill }]} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {track.artist || "YouTube"}
          {track.durationMs ? `  ·  ${formatTime(track.durationMs)}` : ""}
        </Text>
      </View>
      <Button title="Clip" size="sm" icon="cut" onPress={onClip} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 8, borderRadius: 12 },
  rowCurrent: { backgroundColor: colors.surface3 },
  index: { width: 20, textAlign: "center", color: colors.subtle, fontFamily: fonts.mono, fontSize: 12 },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 8 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 15 },
  sub: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
});
