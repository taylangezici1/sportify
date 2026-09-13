import React, { useCallback, useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Clip } from "@repo/ui";
import { formatTime, trackSource } from "@repo/ui";
import { usePlayer } from "@/context/PlayerContext";
import { api, ApiError } from "@/lib/api";
import { colors, fonts, space } from "@/lib/theme";
import { useModeActions } from "@/components/ModeSwitch";
import ClipRow from "@/components/ClipRow";
import { Badge, Button, EmptyState, IconButton, Spinner, Title } from "@/components/ui";

export default function ClipsScreen() {
  const router = useRouter();
  const { playClip, activeClip, isPlaying, togglePlay } = usePlayer();
  const { start, starting } = useModeActions();
  const [clips, setClips] = useState<Clip[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setClips(await api.clips.list());
    } catch (e) {
      Alert.alert("Could not load clips", e instanceof ApiError ? e.message : undefined);
      setClips([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const playable = (clips ?? []).filter((c) => trackSource(c.trackUri) === "youtube");
  const legacy = (clips ?? []).filter((c) => trackSource(c.trackUri) !== "youtube");

  const remove = (clip: Clip) =>
    Alert.alert("Delete this clip?", `${clip.trackName} will be removed.`, [
      { text: "Keep", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setClips((c) => c?.filter((x) => x.id !== clip.id) ?? null);
          try {
            await api.clips.remove(clip.id);
          } catch (e) {
            Alert.alert("Could not delete", e instanceof ApiError ? e.message : undefined);
            void load();
          }
        },
      },
    ]);

  const edit = (clip: Clip) =>
    router.push({
      pathname: "/clipping",
      params: { track: JSON.stringify({ uri: clip.trackUri, title: clip.trackName, artist: clip.artist ?? "", imageUrl: clip.imageUrl ?? undefined, durationMs: clip.durationMs ?? undefined }), clip: JSON.stringify(clip) },
    });

  const findOnYouTube = (clip: Clip) =>
    router.push({ pathname: "/(tabs)/search", params: { q: clip.trackName, start: String(clip.startTime), end: String(clip.endTime), legacy: clip.id } });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Title>Clips</Title>
          <Text style={styles.sub}>
            {playable.length} clip{playable.length === 1 ? "" : "s"}
            {legacy.length > 0 ? ` · ${legacy.length} from Spotify` : ""}
          </Text>
        </View>
        <Button title="Shuffle all" variant="workout" size="sm" icon="flame" loading={starting === "workout"} disabled={playable.length === 0} onPress={() => start("workout", { force: true })} />
      </View>

      {clips === null ? (
        <Spinner label="Loading clips" />
      ) : clips.length === 0 ? (
        <View style={{ padding: space.lg }}>
          <EmptyState
            icon="cut"
            title="No clips yet"
            description="Search for a track, hit Clip, drag the handles around the part you love, save."
            action={<Button title="Go to search" variant="primary" onPress={() => router.push("/(tabs)/search")} />}
          />
        </View>
      ) : (
        <FlatList
          data={playable}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingHorizontal: space.sm, paddingBottom: space.xxl }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={colors.muted}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
            />
          }
          renderItem={({ item }) => {
            const active = activeClip?.id === item.id;
            return (
              <ClipRow
                clip={item}
                active={active}
                playing={active && isPlaying}
                onPress={() => (active ? togglePlay() : playClip(item, playable))}
                onEdit={() => edit(item)}
                onDelete={() => remove(item)}
              />
            );
          }}
          ListFooterComponent={
            legacy.length > 0 ? (
              <View style={{ marginTop: space.xl, paddingHorizontal: space.sm }}>
                <Text style={styles.legacyTitle}>FROM YOUR SPOTIFY DAYS</Text>
                <Text style={styles.legacyDesc}>These cannot play anymore. Find the same track on YouTube and the times are pre-filled.</Text>
                {legacy.map((clip) => (
                  <View key={clip.id} style={styles.legacyRow}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.legacyName} numberOfLines={1}>
                        {clip.trackName}
                      </Text>
                      <Text style={styles.legacyTime}>
                        {formatTime(clip.startTime)} – {formatTime(clip.endTime)}
                      </Text>
                    </View>
                    <Badge>Spotify</Badge>
                    <IconButton name="search" label="Find on YouTube" size={36} bg={colors.surface3} color={colors.text} onPress={() => findOnYouTube(clip)} />
                    <IconButton name="trash-outline" label="Delete" size={36} onPress={() => remove(clip)} />
                  </View>
                ))}
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "center", gap: space.md, paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.sm },
  sub: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, marginTop: 2 },
  legacyTitle: { color: colors.muted, fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1 },
  legacyDesc: { color: colors.subtle, fontFamily: fonts.regular, fontSize: 12, marginTop: 4, marginBottom: 8 },
  legacyRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  legacyName: { color: colors.muted, fontFamily: fonts.bold, fontSize: 14 },
  legacyTime: { color: colors.subtle, fontFamily: fonts.mono, fontSize: 11 },
});
