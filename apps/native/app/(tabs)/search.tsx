import React, { useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { Track } from "@repo/ui";
import { formatTime } from "@repo/ui";
import { usePlayer } from "@/context/PlayerContext";
import { api, ApiError } from "@/lib/api";
import { colors, fonts, radius, space } from "@/lib/theme";
import TrackRow from "@/components/TrackRow";
import { EmptyState, IconButton, Title } from "@/components/ui";

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string; start?: string; end?: string; legacy?: string }>();
  const legacy =
    params.legacy && params.start && params.end
      ? { id: params.legacy, start: Number(params.start), end: Number(params.end), name: params.q ?? "" }
      : null;

  const { playTrack, currentTrack, isPlaying, togglePlay, activeClip } = usePlayer();
  const [query, setQuery] = useState(params.q ?? "");
  const [results, setResults] = useState<Track[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      setResults((await api.search(q)).tracks);
    } catch (e) {
      setResults([]);
      setError(e instanceof ApiError ? e.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const openClipper = (track: Track) =>
    router.push({
      pathname: "/clipping",
      params: {
        track: JSON.stringify(track),
        ...(legacy ? { start: String(legacy.start), end: String(legacy.end), legacy: legacy.id } : {}),
      },
    });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Title>Search</Title>
        <Text style={styles.sub}>YouTube Music, or paste a video link.</Text>
      </View>

      {legacy && (
        <View style={styles.banner}>
          <Ionicons name="cut" size={16} color={colors.workout} />
          <Text style={styles.bannerText} numberOfLines={2}>
            Recreating <Text style={{ fontFamily: fonts.bold }}>{legacy.name}</Text> · {formatTime(legacy.start)} – {formatTime(legacy.end)}
          </Text>
          <IconButton name="close" label="Dismiss" size={30} onPress={() => router.setParams({ legacy: "", start: "", end: "" })} />
        </View>
      )}

      <View style={styles.inputWrap}>
        {loading ? <ActivityIndicator size="small" color={colors.muted} /> : <Ionicons name="search" size={20} color={colors.muted} />}
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          placeholder="Song, artist or link…"
          placeholderTextColor={colors.subtle}
          returnKeyType="search"
          autoCorrect={false}
          style={styles.input}
        />
        {query.length > 0 && <IconButton name="close-circle" label="Clear" size={30} onPress={() => setQuery("")} />}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {results === null ? (
        <View style={{ padding: space.lg }}>
          <EmptyState icon="logo-youtube" title="Find something to clip" description="Search by song or artist, or paste a youtube.com, youtu.be or music.youtube.com link." />
        </View>
      ) : results.length === 0 && !loading ? (
        <View style={{ padding: space.lg }}>
          <EmptyState icon="search" title="No music found" description={`Nothing matched “${query}”.`} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(t, i) => `${t.uri}-${i}`}
          contentContainerStyle={{ paddingHorizontal: space.sm, paddingBottom: space.xxl }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const current = currentTrack?.uri === item.uri && !activeClip;
            return (
              <TrackRow
                track={item}
                current={current}
                playing={current && isPlaying}
                onPress={() => (current ? togglePlay() : playTrack(item))}
                onClip={() => openClipper(item)}
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
  header: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.sm },
  sub: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, marginTop: 2 },
  banner: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: space.lg, marginBottom: space.sm, padding: 10, borderRadius: radius.md, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line },
  bannerText: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 13 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: space.lg, marginBottom: space.md, paddingLeft: 14, paddingRight: 6, height: 52, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  input: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 16, height: "100%" },
  error: { color: colors.danger, fontFamily: fonts.regular, fontSize: 13, marginHorizontal: space.lg, marginBottom: space.sm },
});
