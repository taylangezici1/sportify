import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Clip } from "@repo/ui";
import { formatTime, youtubeThumbnail, youtubeVideoId } from "@repo/ui";
import { colors, fonts } from "@/lib/theme";
import { IconButton, Thumb } from "./ui";

export function clipThumb(clip: Clip): string | undefined {
  if (clip.imageUrl) return clip.imageUrl;
  const id = youtubeVideoId(clip.trackUri);
  return id ? youtubeThumbnail(id) : undefined;
}

interface ClipRowProps {
  clip: Clip;
  active?: boolean;
  playing?: boolean;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function ClipRow({ clip, active, playing, onPress, onEdit, onDelete }: ClipRowProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, active && styles.rowActive, pressed && { opacity: 0.8 }]}>
      <View>
        <Thumb uri={clipThumb(clip)} height={48} />
        {active && (
          <View style={styles.overlay}>
            <Ionicons name={playing ? "pause" : "play"} size={20} color="#fff" />
          </View>
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.title, active && { color: colors.workout }]} numberOfLines={1}>
          {clip.trackName}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {clip.artist ? `${clip.artist}  ·  ` : ""}
          {formatTime(clip.startTime)} – {formatTime(clip.endTime)}  ·  {formatTime(clip.endTime - clip.startTime)}
        </Text>
      </View>
      {onEdit && <IconButton name="create-outline" label="Edit clip" size={36} onPress={onEdit} />}
      {onDelete && <IconButton name="trash-outline" label="Delete clip" size={36} onPress={onDelete} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 8, borderRadius: 12 },
  rowActive: { backgroundColor: colors.surface3 },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 8 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 15 },
  sub: { color: colors.muted, fontFamily: fonts.mono, fontSize: 11, marginTop: 2, fontVariant: ["tabular-nums"] },
});
