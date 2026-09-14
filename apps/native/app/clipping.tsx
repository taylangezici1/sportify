import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { Clip, Track } from "@repo/ui";
import { clamp, formatTime, formatTimePrecise } from "@repo/ui";
import { usePlayer, useStageSlot } from "@/context/PlayerContext";
import { api, ApiError } from "@/lib/api";
import { colors, fonts, radius, space } from "@/lib/theme";
import RangeSlider from "@/components/RangeSlider";
import { Button, IconButton } from "@/components/ui";

const MIN_GAP = 1000;
const DEFAULT_LEN = 30_000;

function parse<T>(raw: string | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export default function ClippingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ track?: string; clip?: string; start?: string; end?: string; legacy?: string }>();
  const track = useMemo(() => parse<Track>(params.track), [params.track]);
  const existing = useMemo(() => parse<Clip>(params.clip), [params.clip]);
  const legacyId = params.legacy || null;

  const { playTrack, setPreviewRange, position, duration, isPlaying, togglePlay, seek, pause, currentTrack, eventTrail } = usePlayer();
  const total = track?.durationMs || duration || 0;

  const [range, setRange] = useState(() => {
    const seedStart = existing?.startTime ?? (params.start ? Number(params.start) : 0);
    const seedEnd = existing?.endTime ?? (params.end ? Number(params.end) : undefined);
    const start = Number.isFinite(seedStart) ? seedStart : 0;
    const end = seedEnd && Number.isFinite(seedEnd) ? seedEnd : Math.min(total || DEFAULT_LEN, start + DEFAULT_LEN);
    return { start, end: Math.max(end, start + MIN_GAP) };
  });
  const [saving, setSaving] = useState(false);
  const slotRef = useRef<View>(null);
  useStageSlot(slotRef);

  useEffect(() => {
    if (track) playTrack(track, { startMs: range.start });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per opened track
  }, [track?.uri]);

  useEffect(() => {
    setPreviewRange(range);
  }, [range, setPreviewRange]);

  useEffect(
    () => () => {
      setPreviewRange(null);
      pause();
    },
    [setPreviewRange, pause],
  );

  useEffect(() => {
    if (total > 0 && range.end > total) setRange((r) => ({ start: Math.min(r.start, total - MIN_GAP), end: total }));
  }, [total, range.end]);

  const update = useCallback(
    (start: number, end: number) => {
      const s = clamp(start, 0, Math.max(0, (total || Infinity) - MIN_GAP));
      const e = clamp(end, s + MIN_GAP, total || Infinity);
      setRange({ start: s, end: e });
    },
    [total],
  );

  const nudge = (handle: "start" | "end", delta: number) => {
    const s = handle === "start" ? range.start + delta : range.start;
    const e = handle === "end" ? range.end + delta : range.end;
    update(s, e);
    seek(handle === "start" ? s : Math.max(s, e - 3000));
  };

  const save = async () => {
    if (!track) return;
    setSaving(true);
    try {
      const input = {
        trackUri: track.uri,
        trackName: track.title,
        artist: track.artist,
        imageUrl: track.imageUrl ?? null,
        durationMs: total || null,
        startTime: range.start,
        endTime: range.end,
      };
      if (existing) await api.clips.update(existing.id, input);
      else await api.clips.create(input);
      if (legacyId) await api.clips.remove(legacyId).catch(() => {});
      router.back();
    } catch (e) {
      Alert.alert("Could not save", e instanceof ApiError ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  if (!track) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.sub}>Nothing to clip.</Text>
      </SafeAreaView>
    );
  }

  const loadedThisTrack = currentTrack?.uri === track.uri;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <IconButton name="close" label="Close" size={40} color={colors.text} onPress={() => router.back()} />
        <Text style={styles.heading}>{existing ? "Edit clip" : "Create clip"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View ref={slotRef} collapsable={false} style={styles.hero} />
        <Text style={styles.title} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {track.artist || "YouTube"}
        </Text>

        <View style={{ marginTop: space.lg }}>
          {total > 0 ? (
            <RangeSlider
              duration={total}
              start={range.start}
              end={range.end}
              position={loadedThisTrack ? position : undefined}
              minGap={MIN_GAP}
              onChange={update}
              onCommit={(s, e, handle) => seek(handle === "start" ? s : Math.max(s, e - 3000))}
            />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12 }}>
              <ActivityIndicator size="small" color={colors.muted} />
              <Text style={styles.sub}>Loading track length…</Text>
            </View>
          )}
        </View>

        <View style={styles.handles}>
          {(["start", "end"] as const).map((handle) => (
            <View key={handle} style={styles.handleCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.handleLabel}>{handle.toUpperCase()}</Text>
                <Text style={styles.handleTime}>{formatTimePrecise(range[handle])}</Text>
              </View>
              <View style={styles.nudges}>
                {[
                  ["−1s", -1000],
                  ["−.1", -100],
                  ["+.1", 100],
                  ["+1s", 1000],
                ].map(([label, delta]) => (
                  <Pressable key={label} onPress={() => nudge(handle, Number(delta))} style={({ pressed }) => [styles.nudge, pressed && { opacity: 0.7 }]}>
                    <Text style={styles.nudgeText}>{label}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable
                disabled={!loadedThisTrack}
                onPress={() => (handle === "start" ? update(position, range.end) : update(range.start, position))}
                style={({ pressed }) => [styles.setBtn, (pressed || !loadedThisTrack) && { opacity: 0.6 }]}
              >
                <Text style={styles.setBtnText}>Set {handle} to playhead</Text>
              </Pressable>
            </View>
          ))}
        </View>
        <Text style={styles.trail} selectable>
          {eventTrail.join("\n")}
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={togglePlay} disabled={!loadedThisTrack} style={[styles.play, !loadedThisTrack && { opacity: 0.4 }]} accessibilityLabel={isPlaying ? "Pause" : "Play"}>
          <Ionicons name={isPlaying ? "pause" : "play"} size={22} color={colors.bg} style={!isPlaying && { marginLeft: 2 }} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.mono}>{loadedThisTrack ? formatTime(position) : "–:––"}</Text>
          <Text style={[styles.mono, { color: colors.subtle }]}>clip {formatTime(range.end - range.start)}</Text>
        </View>
        <Button title={existing ? "Save changes" : "Save clip"} variant="primary" loading={saving} disabled={total <= 0} onPress={save} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: space.md, paddingVertical: space.sm },
  heading: { color: colors.text, fontFamily: fonts.black, fontSize: 18 },
  content: { paddingHorizontal: space.lg, paddingBottom: space.lg },
  hero: { width: "100%", aspectRatio: 16 / 9, borderRadius: radius.md, backgroundColor: colors.black, overflow: "hidden" },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 16, marginTop: space.md },
  sub: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, marginTop: 2 },
  handles: { flexDirection: "row", gap: space.md, marginTop: space.md },
  handleCard: { flex: 1, backgroundColor: colors.surface2, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: space.md, gap: space.sm },
  handleLabel: { color: colors.subtle, fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1 },
  handleTime: { color: colors.text, fontFamily: fonts.mono, fontSize: 15, fontVariant: ["tabular-nums"] },
  nudges: { flexDirection: "row", gap: 4 },
  nudge: { flex: 1, height: 32, borderRadius: 999, backgroundColor: colors.surface3, alignItems: "center", justifyContent: "center" },
  nudgeText: { color: colors.text, fontFamily: fonts.bold, fontSize: 12 },
  setBtn: { height: 32, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  setBtnText: { color: colors.muted, fontFamily: fonts.bold, fontSize: 12 },
  footer: { flexDirection: "row", alignItems: "center", gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, borderTopWidth: 1, borderTopColor: colors.line },
  play: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.text, alignItems: "center", justifyContent: "center" },
  mono: { color: colors.muted, fontFamily: fonts.mono, fontSize: 12, fontVariant: ["tabular-nums"] },
  trail: { color: colors.subtle, fontFamily: fonts.mono, fontSize: 10, marginTop: space.lg },
});
