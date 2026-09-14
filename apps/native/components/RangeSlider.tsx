import React, { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
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
type Handle = "start" | "end";

/**
 * Two-thumb range selector. Uses the gesture handler so a drag keeps working
 * inside a ScrollView (the plain responder system gets cancelled by the
 * native scroll recogniser on the first vertical wobble).
 */
export default function RangeSlider({ duration, start, end, position, minGap = 1000, onChange, onCommit }: RangeSliderProps) {
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<Handle | null>(null);
  const widthRef = useRef(0);
  // Latest values for use inside gesture callbacks.
  const stateRef = useRef({ start, end, duration, minGap, onChange, onCommit });
  stateRef.current = { start, end, duration, minGap, onChange, onCommit };
  const activeRef = useRef<Handle | null>(null);

  const safe = Math.max(1, duration);
  const px = (ms: number) => clamp(ms / safe, 0, 1) * width;

  const toMs = (x: number) => clamp(x / Math.max(1, widthRef.current), 0, 1) * Math.max(1, stateRef.current.duration);

  const clampFor = (handle: Handle, ms: number) => {
    const { start: s, end: e, minGap: gap, duration: d } = stateRef.current;
    return handle === "start" ? clamp(Math.round(ms), 0, e - gap) : clamp(Math.round(ms), s + gap, Math.max(1, d));
  };

  const begin = (x: number) => {
    const ms = toMs(x);
    const { start: s, end: e } = stateRef.current;
    const handle: Handle = Math.abs(ms - s) < Math.abs(ms - e) ? "start" : Math.abs(ms - s) > Math.abs(ms - e) ? "end" : ms < s ? "start" : "end";
    activeRef.current = handle;
    setActive(handle);
    move(x);
  };
  const move = (x: number) => {
    const handle = activeRef.current;
    if (!handle) return;
    const v = clampFor(handle, toMs(x));
    const { start: s, end: e, onChange: change } = stateRef.current;
    if (handle === "start") change(v, e);
    else change(s, v);
  };
  const finish = (x: number) => {
    const handle = activeRef.current;
    activeRef.current = null;
    setActive(null);
    if (!handle) return;
    const v = clampFor(handle, toMs(x));
    const { start: s, end: e, onChange: change, onCommit: commit } = stateRef.current;
    const ns = handle === "start" ? v : s;
    const ne = handle === "end" ? v : e;
    change(ns, ne);
    commit?.(ns, ne, handle);
  };
  const cancel = () => {
    activeRef.current = null;
    setActive(null);
  };

  const gesture = Gesture.Pan()
    .activeOffsetX([-3, 3])
    .failOffsetY([-14, 14])
    .onBegin((e) => runOnJS(begin)(e.x))
    .onUpdate((e) => runOnJS(move)(e.x))
    .onEnd((e) => runOnJS(finish)(e.x))
    .onFinalize((e, success) => {
      if (!success) runOnJS(cancel)();
    });

  return (
    <View>
      <GestureDetector gesture={gesture}>
        <View
          onLayout={(e) => {
            widthRef.current = e.nativeEvent.layout.width;
            setWidth(e.nativeEvent.layout.width);
          }}
          style={styles.hit}
          collapsable={false}
        >
          <View style={styles.track} />
          <View style={[styles.selected, { left: px(start), width: Math.max(0, px(end) - px(start)) }]} />
          {position !== undefined && <View style={[styles.playhead, { left: px(position) - 1 }]} />}
          <View style={[styles.thumb, { left: px(start) - THUMB / 2 }, active === "start" && styles.thumbActive]} />
          <View style={[styles.thumb, { left: px(end) - THUMB / 2 }, active === "end" && styles.thumbActive]} />
        </View>
      </GestureDetector>
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
