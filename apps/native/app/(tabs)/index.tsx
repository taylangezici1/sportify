import React, { useCallback, useState } from "react";
import { Alert, FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { Clip } from "@repo/ui";
import { formatTime, trackSource } from "@repo/ui";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { api } from "@/lib/api";
import { colors, fonts, radius, space } from "@/lib/theme";
import { useModeActions } from "@/components/ModeSwitch";
import { clipThumb } from "@/components/ClipRow";
import { Button, Thumb } from "@/components/ui";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Late night session";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const { playlists, loadPlaylists, playClip, activeClip } = usePlayer();
  const { start, starting } = useModeActions();
  const router = useRouter();
  const [clips, setClips] = useState<Clip[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setClips(await api.clips.list());
    } catch {
      setClips([]);
    }
    void loadPlaylists();
  }, [loadPlaylists]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const playable = (clips ?? []).filter((c) => trackSource(c.trackUri) === "youtube");
  const chill = playlists.find((p) => p.id === user?.chillPlaylistId);
  const firstName = user?.name?.split(" ")[0];

  const confirmSignOut = () =>
    Alert.alert("Sign out?", user?.email ?? undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => void signOut() },
    ]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
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
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>
              {greeting()}
              {firstName ? `, ${firstName}` : ""}
            </Text>
            <Text style={styles.subtitle}>Pick a mode and go.</Text>
          </View>
          <Pressable onPress={confirmSignOut} accessibilityLabel="Account">
            {user?.image ? (
              <Image source={{ uri: user.image }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { alignItems: "center", justifyContent: "center" }]}>
                <Ionicons name="person" size={18} color={colors.muted} />
              </View>
            )}
          </Pressable>
        </View>

        <View style={[styles.card, { borderColor: "rgba(255,122,26,0.35)" }]}>
          <View style={[styles.glow, { backgroundColor: "rgba(255,122,26,0.18)" }]} />
          <View style={[styles.pill, { backgroundColor: "rgba(255,122,26,0.15)" }]}>
            <Ionicons name="flame" size={13} color={colors.workout} />
            <Text style={[styles.pillText, { color: colors.workout }]}>WORKOUT</Text>
          </View>
          <Text style={styles.cardTitle}>Your clips, back to back</Text>
          <Text style={styles.cardSub}>
            {clips === null ? "Counting your clips…" : playable.length === 0 ? "No clips yet. Make one from search." : `${playable.length} clip${playable.length === 1 ? "" : "s"} · shuffled`}
          </Text>
          <View style={styles.cardActions}>
            <Button
              title="Start workout"
              variant="workout"
              icon="play"
              loading={starting === "workout"}
              disabled={clips !== null && playable.length === 0}
              onPress={() => start("workout", { force: true })}
            />
            <Button title="New clip" icon="cut" onPress={() => router.push("/(tabs)/search")} />
          </View>
        </View>

        <View style={[styles.card, { borderColor: "rgba(76,201,255,0.35)" }]}>
          <View style={[styles.glow, { backgroundColor: "rgba(76,201,255,0.18)" }]} />
          <View style={[styles.pill, { backgroundColor: "rgba(76,201,255,0.15)" }]}>
            <Ionicons name="snow" size={13} color={colors.chill} />
            <Text style={[styles.pillText, { color: colors.chill }]}>CHILL</Text>
          </View>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {chill ? chill.title : "Shuffle a playlist"}
          </Text>
          <Text style={styles.cardSub}>{chill ? "Full tracks, shuffled, from your playlist." : "Choose one of your YouTube Music playlists."}</Text>
          <View style={styles.cardActions}>
            <Button
              title={chill ? "Start chill" : "Pick a playlist"}
              variant="chill"
              icon="play"
              loading={starting === "chill"}
              onPress={() => start("chill", { force: true })}
            />
            <Button title="Playlists" icon="list" onPress={() => router.push("/(tabs)/playlists")} />
          </View>
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Recent clips</Text>
          <Pressable onPress={() => router.push("/(tabs)/clips")}>
            <Text style={styles.link}>See all</Text>
          </Pressable>
        </View>
        {clips !== null && playable.length === 0 ? (
          <Text style={styles.emptyLine}>Nothing here yet. Search for a track and hit Clip.</Text>
        ) : (
          <FlatList
            horizontal
            data={playable.slice(0, 10)}
            keyExtractor={(c) => c.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10 }}
            renderItem={({ item }) => (
              <Pressable onPress={() => playClip(item, playable)} style={[styles.clipCard, activeClip?.id === item.id && { borderColor: colors.workout }]}>
                <Thumb uri={clipThumb(item)} height={90} width={160} rounded={0} />
                <View style={styles.clipLen}>
                  <Text style={styles.clipLenText}>{formatTime(item.endTime - item.startTime)}</Text>
                </View>
                <View style={{ padding: 10 }}>
                  <Text style={styles.clipTitle} numberOfLines={1}>
                    {item.trackName}
                  </Text>
                  <Text style={styles.clipSub} numberOfLines={1}>
                    {item.artist || "YouTube"}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, paddingBottom: space.xxl, gap: space.md },
  header: { flexDirection: "row", alignItems: "center", gap: space.md, marginBottom: space.sm },
  title: { color: colors.text, fontFamily: fonts.black, fontSize: 28, letterSpacing: -0.5 },
  subtitle: { color: colors.muted, fontFamily: fonts.regular, fontSize: 14, marginTop: 2 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface3 },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, padding: space.lg, overflow: "hidden" },
  glow: { position: "absolute", right: -40, top: -40, width: 160, height: 160, borderRadius: 80 },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 10 },
  pillText: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1 },
  cardTitle: { color: colors.text, fontFamily: fonts.black, fontSize: 22 },
  cardSub: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },
  cardActions: { flexDirection: "row", gap: 8, marginTop: space.lg, flexWrap: "wrap" },
  sectionHead: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: space.lg, marginBottom: 4 },
  sectionTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 17 },
  link: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13 },
  emptyLine: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, padding: space.lg, borderWidth: 1, borderStyle: "dashed", borderColor: colors.line, borderRadius: radius.lg },
  clipCard: { width: 160, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, overflow: "hidden" },
  clipLen: { position: "absolute", top: 66, right: 6, backgroundColor: "rgba(0,0,0,0.7)", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  clipLenText: { color: "#fff", fontFamily: fonts.mono, fontSize: 10 },
  clipTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 13 },
  clipSub: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, marginTop: 2 },
});
