import React, { useRef, useState } from "react";
import { StyleSheet, Text, View, type GestureResponderEvent } from "react-native";
import { clamp, formatTime } from "@repo/ui";
import { colors, fonts } from "@/lib/theme";

interface RangeSliderProps {
  duration: number;
  start: number;
  end: number;
  position?: number;
  minGap?: number;
  onChange: (start: number, end: number) => void;
  onCommit?: (start: number, end: number, handle: "start" | "end") => void;
}

const THUMB = 26;

/** Two-thumb range selector. Grabs whichever handle is closer to the touch. */
export default function RangeSlider({ duration, start, end, position, minGap = 1000, onChange, onCommit }: RangeSliderProps) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const activeRef = useRef<"start" | "end" | null>(null);
  const [active, setActive] = useState<"start" | "end" | null>(null);
  const safe = Math.max(1, duration);
  const px = (ms: number) => clamp(ms / safe, 0, 1) * width;

  const toMs = (e: GestureResponderEvent) => clamp(e.nativeEvent.locationX / Math.max(1, widthRef.current), 0, 1) * safe;

  const move = (handle: "start" | "end", ms: number) => {
    if (handle === "start") onChange(clamp(Math.round(ms), 0, end - minGap), end);
    else onChange(start, clamp(Math.round(ms), start + minGap, safe));
  };

  return (
    <View>
      <View
        onLayout={(e) => {
          widthRef.current = e.nativeEvent.layout.width;
          setWidth(e.nativeEvent.layout.width);
        }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => {
          const ms = toMs(e);
          const handle: "start" | "end" =
            Math.abs(ms - start) < Math.abs(ms - end) ? "start" : Math.abs(ms - start) > Math.abs(ms - end) ? "end" : ms < start ? "start" : "end";
          activeRef.current = handle;
          setActive(handle);
          move(handle, ms);
        }}
        onResponderMove={(e) => {
          if (activeRef.current) move(activeRef.current, toMs(e));
        }}
        onResponderRelease={(e) => {
          const handle = activeRef.current;
          activeRef.current = null;
          setActive(null);
          if (!handle) return;
          const ms = toMs(e);
          const ns = handle === "start" ? clamp(Math.round(ms), 0, end - minGap) : start;
          const ne = handle === "end" ? clamp(Math.round(ms), start + minGap, safe) : end;
          onChange(ns, ne);
          onCommit?.(ns, ne, handle);
        }}
        onResponderTerminate={() => {
          activeRef.current = null;
          setActive(null);
        }}
        style={styles.hit}
      >
        <View style={styles.track} />
        <View style={[styles.selected, { left: px(start), width: Math.max(0, px(end) - px(start)) }]} />
        {position !== undefined && <View style={[styles.playhead, { left: px(position) - 1 }]} />}
        <View style={[styles.thumb, { left: px(start) - THUMB / 2 }, active === "start" && styles.thumbActive]} />
        <View style={[styles.thumb, { left: px(end) - THUMB / 2 }, active === "end" && styles.thumbActive]} />
      </View>
      <View style={styles.labels}>
        <Text style={styles.label}>0:00</Text>
        <Text style={styles.label}>{formatTime(safe)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hit: { height: 48, justifyContent: "center" },
  track: { position: "absolute", left: 0, right: 0, height: 8, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.1)" },
  selected: { position: "absolute", height: 8, borderRadius: 999, backgroundColor: colors.brand },
  playhead: { position: "absolute", width: 2, height: 20, borderRadius: 1, backgroundColor: "rgba(255,255,255,0.85)" },
  thumb: {
    position: "absolute",
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.text,
    borderWidth: 3,
    borderColor: colors.bg,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  thumbActive: { transform: [{ scale: 1.2 }] },
  labels: { flexDirection: "row", justifyContent: "space-between" },
  label: { color: colors.subtle, fontFamily: fonts.mono, fontSize: 11 },
});
