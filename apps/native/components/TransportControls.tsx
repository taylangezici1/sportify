import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePlayer } from "@/context/PlayerContext";
import { colors } from "@/lib/theme";
import { IconButton } from "./ui";

export default function TransportControls({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const { isPlaying, togglePlay, next, previous, isShuffle, toggleShuffle, queue, isActive } = usePlayer();
  const canSkip = queue.length > 1;
  const dims = size === "lg" ? { main: 72, icon: 34, side: 52, sideIcon: 30 } : size === "sm" ? { main: 40, icon: 20, side: 36, sideIcon: 22 } : { main: 52, icon: 24, side: 44, sideIcon: 26 };

  return (
    <View style={[styles.row, { gap: size === "lg" ? 20 : 4 }]}>
      {size !== "sm" && (
        <IconButton
          name="shuffle"
          label="Shuffle"
          size={dims.side}
          iconSize={dims.sideIcon - 6}
          color={isShuffle ? colors.brand : colors.muted}
          disabled={!canSkip}
          onPress={toggleShuffle}
        />
      )}
      <IconButton name="play-skip-back" label="Previous" size={dims.side} iconSize={dims.sideIcon} color={colors.text} disabled={!isActive} onPress={previous} />
      <Pressable
        onPress={togglePlay}
        disabled={!isActive}
        accessibilityLabel={isPlaying ? "Pause" : "Play"}
        style={({ pressed }) => [
          styles.main,
          { width: dims.main, height: dims.main, borderRadius: dims.main / 2, opacity: !isActive ? 0.4 : pressed ? 0.85 : 1 },
        ]}
      >
        <Ionicons name={isPlaying ? "pause" : "play"} size={dims.icon} color={colors.bg} style={!isPlaying && { marginLeft: 3 }} />
      </Pressable>
      <IconButton name="play-skip-forward" label="Next" size={dims.side} iconSize={dims.sideIcon} color={colors.text} disabled={!isActive} onPress={next} />
      {size === "lg" && <View style={{ width: dims.side }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  main: { backgroundColor: colors.text, alignItems: "center", justifyContent: "center" },
});
