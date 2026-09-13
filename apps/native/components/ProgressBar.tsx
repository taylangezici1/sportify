import React, { useRef, useState } from "react";
import { StyleSheet, Text, View, type GestureResponderEvent } from "react-native";
import { clamp, formatTime } from "@repo/ui";
import { colors, fonts } from "@/lib/theme";

interface ProgressBarProps {
  position: number;
  rangeStart?: number;
  rangeEnd: number;
  onSeek?: (ms: number) => void;
  color?: string;
  showTimes?: boolean;
  thin?: boolean;
}

/** Seekable progress bar scoped to a clip window, touch-friendly (40pt hit area). */
export default function ProgressBar({
  position,
  rangeStart = 0,
  rangeEnd,
  onSeek,
  color = colors.text,
  showTimes,
  thin,
}: ProgressBarProps) {
  const [width, setWidth] = useState(0);
  const [drag, setDrag] = useState<number | null>(null);
  const widthRef = useRef(0);
  const span = Math.max(1, rangeEnd - rangeStart);
  const shown = drag ?? position;
  const pct = clamp((shown - rangeStart) / span, 0, 1);

  const toMs = (e: GestureResponderEvent) => rangeStart + clamp(e.nativeEvent.locationX / Math.max(1, widthRef.current), 0, 1) * span;

  return (
    <View>
      <View
        onLayout={(e) => {
          widthRef.current = e.nativeEvent.layout.width;
          setWidth(e.nativeEvent.layout.width);
        }}
        onStartShouldSetResponder={() => Boolean(onSeek)}
        onMoveShouldSetResponder={() => Boolean(onSeek)}
        onResponderGrant={(e) => setDrag(toMs(e))}
        onResponderMove={(e) => setDrag(toMs(e))}
        onResponderRelease={(e) => {
          const ms = toMs(e);
          setDrag(null);
          onSeek?.(ms);
        }}
        onResponderTerminate={() => setDrag(null)}
        style={[styles.hit, thin && { height: 12 }]}
      >
        <View style={[styles.track, thin && { height: 3 }]}>
          <View style={[styles.fill, { width: width * pct, backgroundColor: color }]} />
        </View>
        {onSeek && !thin && <View style={[styles.knob, { left: width * pct - 7, opacity: drag !== null ? 1 : 0.9 }]} />}
      </View>
      {showTimes && (
        <View style={styles.times}>
          <Text style={styles.time}>{formatTime(shown - rangeStart)}</Text>
          <Text style={styles.time}>{formatTime(span)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hit: { height: 36, justifyContent: "center" },
  track: { height: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.15)", overflow: "hidden" },
  fill: { height: "100%", borderRadius: 999 },
  knob: {
    position: "absolute",
    top: 11,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.text,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  times: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  time: { color: colors.muted, fontFamily: fonts.mono, fontSize: 11, fontVariant: ["tabular-nums"] },
});
