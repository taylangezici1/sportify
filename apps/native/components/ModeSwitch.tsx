import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { usePlayer, type Mode } from "@/context/PlayerContext";
import { colors, fonts } from "@/lib/theme";

/** Starts a mode, routing the user to whatever is missing when it cannot start. */
export function useModeActions() {
  const { mode, isActive, startWorkout, startChill } = usePlayer();
  const router = useRouter();
  const [starting, setStarting] = useState<Mode | null>(null);

  const start = useCallback(
    async (target: Mode, opts?: { force?: boolean }) => {
      if (!opts?.force && isActive && target === mode) return;
      setStarting(target);
      try {
        const result = target === "workout" ? await startWorkout() : await startChill();
        if (result.ok) return;
        if (result.reason === "no-clips") {
          Alert.alert("No clips yet", "Search for a track and clip the part you want.", [
            { text: "Later", style: "cancel" },
            { text: "Search", onPress: () => router.push("/(tabs)/search") },
          ]);
        } else if (result.reason === "no-playlist") {
          Alert.alert("Pick a chill playlist", "Choose one of your YouTube Music playlists first.", [
            { text: "Later", style: "cancel" },
            { text: "Playlists", onPress: () => router.push("/(tabs)/playlists") },
          ]);
        } else if (result.message) {
          Alert.alert("Could not start", result.message);
        }
      } finally {
        setStarting(null);
      }
    },
    [isActive, mode, startWorkout, startChill, router],
  );

  return { mode, start, starting };
}

export default function ModeSwitch({ compact = false }: { compact?: boolean }) {
  const { mode, start, starting } = useModeActions();

  const item = (target: Mode, label: string, icon: keyof typeof Ionicons.glyphMap) => {
    const active = mode === target;
    const bg = target === "workout" ? colors.workout : colors.chill;
    return (
      <Pressable
        onPress={() => start(target)}
        style={[styles.item, compact && styles.itemCompact, active && { backgroundColor: bg }]}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
      >
        {starting === target ? (
          <ActivityIndicator size="small" color={active ? colors.black : colors.muted} />
        ) : (
          <Ionicons name={icon} size={compact ? 14 : 16} color={active ? colors.black : colors.muted} />
        )}
        {(!compact || active) && (
          <Text style={[styles.label, compact && { fontSize: 10 }, { color: active ? colors.black : colors.muted }]}>{label}</Text>
        )}
      </Pressable>
    );
  };

  return (
    <View style={[styles.group, compact && { alignSelf: "flex-start" }]}>
      {item("workout", "WORKOUT", "flame")}
      {item("chill", "CHILL", "snow")}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { flexDirection: "row", gap: 4, padding: 4, borderRadius: 999, backgroundColor: "rgba(38,38,41,0.7)" },
  item: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 40, paddingHorizontal: 10, borderRadius: 999 },
  itemCompact: { flex: 0, height: 32, paddingHorizontal: 10 },
  label: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1 },
});
