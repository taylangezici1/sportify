import React, { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { PlaylistSummary, Track } from "@repo/ui";
import { formatTime } from "@repo/ui";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { api, ApiError } from "@/lib/api";
import { colors, fonts, radius, space } from "@/lib/theme";
import TrackRow from "@/components/TrackRow";
import { Button, EmptyState, IconButton, Spinner, Thumb } from "@/components/ui";

export default function PlaylistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, setChillPlaylistId } = useAuth();
  const { playTracks, currentTrack, isPlaying, togglePlay, activeClip } = usePlayer();
  const [loaded, setLoaded] = useState<{ id: string; data?: { playlist: PlaylistSummary; tracks: Track[] }; error?: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api.playlists
      .get(id)
      .then((data) => !cancelled && setLoaded({ id, data }))
      .catch((e) => !cancelled && setLoaded({ id, error: e instanceof ApiError ? e.message : "Could not load this playlist." }));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const current = loaded?.id === id ? loaded : null;

  const header = () => {
    if (!current?.data) return null;
    const { playlist, tracks } = current.data;
    const isChill = playlist.id === user?.chillPlaylistId;
    const totalMs = tracks.reduce((s, t) => s + (t.durationMs ?? 0), 0);
    return (
      <View style={styles.header}>
        {playlist.id === "LM" ? (
          <View style={styles.liked}>
            <Ionicons name="heart" size={48} color="#fff" />
          </View>
        ) : (
          <Thumb uri={playlist.imageUrl} height={0} width="100%" rounded={radius.lg} style={{ aspectRatio: 16 / 9, height: undefined }} />
        )}
        <Text style={styles.kicker}>PLAYLIST</Text>
        <Text style={styles.title} numberOfLines={2}>
          {playlist.title}
        </Text>
        <Text style={styles.meta}>
          {playlist.owner ? `${playlist.owner} · ` : ""}
          {tracks.length} tracks{totalMs > 0 ? ` · ${formatTime(totalMs)}` : ""}
        </Text>
        <View style={styles.actions}>
          <Button title="Play" variant="primary" icon="play" disabled={!tracks.length} onPress={() => playTracks(tracks)} />
          <Button title="Shuffle" icon="shuffle" disabled={!tracks.length} onPress={() => playTracks(tracks, { shuffle: true })} />
          <Button
            title={isChill ? "Chill playlist" : "Use for chill"}
            variant={isChill ? "chill" : "secondary"}
            icon="snow"
            onPress={async () => {
              if (isChill) return;
              try {
                await setChillPlaylistId(playlist.id);
              } catch {
                Alert.alert("Could not save", "Try again in a moment.");
              }
            }}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topBar}>
        <IconButton name="chevron-back" label="Back" size={40} color={colors.text} bg={colors.surface3} onPress={() => router.back()} />
      </View>
      {!current ? (
        <Spinner label="Loading playlist" />
      ) : current.error ? (
        <View style={{ padding: space.lg }}>
          <EmptyState icon="alert-circle" title="Playlist unavailable" description={current.error} />
        </View>
      ) : (
        <FlatList
          data={current.data!.tracks}
          keyExtractor={(t, i) => `${t.uri}-${i}`}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <View style={{ padding: space.lg }}>
              <EmptyState title="No playable tracks" description="Every video here is private, deleted or not embeddable." />
            </View>
          }
          contentContainerStyle={{ paddingHorizontal: space.sm, paddingBottom: space.xxl }}
          renderItem={({ item, index }) => {
            const isCurrent = currentTrack?.uri === item.uri && !activeClip;
            return (
              <TrackRow
                track={item}
                index={index}
                current={isCurrent}
                playing={isCurrent && isPlaying}
                onPress={() => (isCurrent ? togglePlay() : playTracks(current.data!.tracks, { startIndex: index }))}
                onClip={() => router.push({ pathname: "/clipping", params: { track: JSON.stringify(item) } })}
              />
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { paddingHorizontal: space.lg, paddingVertical: space.sm },
  header: { paddingHorizontal: space.sm, paddingBottom: space.lg, gap: 4 },
  liked: { aspectRatio: 16 / 9, borderRadius: radius.lg, alignItems: "center", justifyContent: "center", backgroundColor: "#2a1a44" },
  kicker: { color: colors.muted, fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1, marginTop: space.lg },
  title: { color: colors.text, fontFamily: fonts.black, fontSize: 26, letterSpacing: -0.5 },
  meta: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: space.md },
});
