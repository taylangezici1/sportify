import React, { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { PlaylistSummary } from "@repo/ui";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { colors, fonts, radius, space } from "@/lib/theme";
import { Button, EmptyState, Spinner, Thumb, Title } from "@/components/ui";

export default function PlaylistsScreen() {
  const router = useRouter();
  const { user, setChillPlaylistId } = useAuth();
  const { playlists, playlistsLoading, loadPlaylists, lastError } = usePlayer();
  const [link, setLink] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void loadPlaylists();
    }, [loadPlaylists]),
  );

  const setChill = async (p: PlaylistSummary) => {
    if (p.id === user?.chillPlaylistId) return;
    try {
      await setChillPlaylistId(p.id);
    } catch {
      Alert.alert("Could not save", "Try again in a moment.");
    }
  };

  const open = (id: string) => router.push({ pathname: "/playlist/[id]", params: { id } });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Title>Playlists</Title>
        <Text style={styles.sub}>Mark one as the chill playlist to shuffle it in chill mode.</Text>
      </View>

      <View style={styles.inputWrap}>
        <Ionicons name="link" size={18} color={colors.muted} />
        <TextInput
          value={link}
          onChangeText={setLink}
          onSubmitEditing={() => link.trim() && open(link.trim())}
          placeholder="Open any public playlist by link…"
          placeholderTextColor={colors.subtle}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
          style={styles.input}
        />
        <Button title="Open" size="sm" variant="primary" disabled={!link.trim()} onPress={() => open(link.trim())} />
      </View>

      {playlistsLoading && playlists.length === 0 ? (
        <Spinner label="Loading playlists" />
      ) : playlists.length === 0 ? (
        <View style={{ padding: space.lg }}>
          <EmptyState
            icon="list"
            title="No playlists found"
            description={lastError ?? "Playlists you create in YouTube Music show up here."}
            action={<Button title="Refresh" onPress={() => loadPlaylists(true)} />}
          />
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={{ gap: space.md }}
          contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: space.xxl }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={colors.muted}
              onRefresh={async () => {
                setRefreshing(true);
                await loadPlaylists(true);
                setRefreshing(false);
              }}
            />
          }
          renderItem={({ item }) => {
            const isChill = item.id === user?.chillPlaylistId;
            return (
              <Pressable onPress={() => open(item.id)} style={[styles.card, isChill && { borderColor: colors.chill }]}>
                {item.id === "LM" ? (
                  <View style={styles.liked}>
                    <Ionicons name="heart" size={36} color="#fff" />
                  </View>
                ) : (
                  <Thumb uri={item.imageUrl} height={0} width="100%" rounded={0} style={{ aspectRatio: 16 / 9, height: undefined }} />
                )}
                <Pressable
                  onPress={() => setChill(item)}
                  hitSlop={6}
                  style={[styles.chillBtn, isChill ? { backgroundColor: colors.chill } : { backgroundColor: "rgba(0,0,0,0.65)" }]}
                  accessibilityLabel={isChill ? "Current chill playlist" : "Use for chill mode"}
                >
                  <Ionicons name="snow" size={13} color={isChill ? colors.black : "#fff"} />
                  {isChill && <Text style={styles.chillText}>CHILL</Text>}
                </Pressable>
                <View style={{ padding: 10 }}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardSub} numberOfLines={1}>
                    {item.itemCount > 0 ? `${item.itemCount} tracks` : item.owner || "Playlist"}
                  </Text>
                </View>
              </Pressable>
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
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: space.lg, marginBottom: space.sm, paddingLeft: 14, paddingRight: 6, height: 48, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  input: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 14, height: "100%" },
  card: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, overflow: "hidden" },
  liked: { aspectRatio: 16 / 9, alignItems: "center", justifyContent: "center", backgroundColor: "#2a1a44" },
  chillBtn: { position: "absolute", top: 8, right: 8, flexDirection: "row", alignItems: "center", gap: 4, height: 28, paddingHorizontal: 9, borderRadius: 999 },
  chillText: { color: colors.black, fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1 },
  cardTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 13 },
  cardSub: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, marginTop: 2 },
});
