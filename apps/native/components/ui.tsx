import React, { type ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, space } from "@/lib/theme";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "workout" | "chill";

const variantStyles: Record<Variant, { bg: string; fg: string }> = {
  primary: { bg: colors.text, fg: colors.bg },
  secondary: { bg: colors.surface3, fg: colors.text },
  ghost: { bg: "transparent", fg: colors.muted },
  danger: { bg: "rgba(255,77,79,0.15)", fg: colors.danger },
  workout: { bg: colors.workout, fg: colors.black },
  chill: { bg: colors.chill, fg: colors.black },
};

export function Button({
  title,
  variant = "secondary",
  size = "md",
  icon,
  loading,
  disabled,
  style,
  ...rest
}: PressableProps & {
  title: string;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const v = variantStyles[variant];
  const h = size === "lg" ? 52 : size === "sm" ? 34 : 44;
  const fs = size === "lg" ? 16 : size === "sm" ? 12 : 14;
  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: v.bg, height: h, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} size="small" />
      ) : icon ? (
        <Ionicons name={icon} size={fs + 4} color={v.fg} />
      ) : null}
      <Text style={{ color: v.fg, fontFamily: fonts.bold, fontSize: fs }}>{title}</Text>
    </Pressable>
  );
}

export function IconButton({
  name,
  label,
  size = 44,
  iconSize,
  color = colors.muted,
  bg = "transparent",
  disabled,
  style,
  ...rest
}: PressableProps & {
  name: keyof typeof Ionicons.glyphMap;
  label: string;
  size?: number;
  iconSize?: number;
  color?: string;
  bg?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: "center", justifyContent: "center" },
        { opacity: disabled ? 0.35 : pressed ? 0.7 : 1 },
        style,
      ]}
      {...rest}
    >
      <Ionicons name={name} size={iconSize ?? Math.round(size * 0.5)} color={color} />
    </Pressable>
  );
}

export function Title({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}
export function Subtitle({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.subtitle, style]}>{children}</Text>;
}
export function Body({
  children,
  muted,
  style,
  numberOfLines,
}: {
  children: ReactNode;
  muted?: boolean;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  return (
    <Text numberOfLines={numberOfLines} style={[styles.body, muted && { color: colors.muted }, style]}>
      {children}
    </Text>
  );
}
export function Mono({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.mono, style]}>{children}</Text>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "workout" | "chill" }) {
  const tones = {
    neutral: { bg: "rgba(255,255,255,0.1)", fg: colors.muted },
    workout: { bg: "rgba(255,122,26,0.15)", fg: colors.workout },
    chill: { bg: "rgba(76,201,255,0.15)", fg: colors.chill },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: tones.bg }]}>
      <Text style={[styles.badgeText, { color: tones.fg }]}>{children}</Text>
    </View>
  );
}

export function Thumb({
  uri,
  width,
  height,
  rounded = radius.sm,
  style,
}: {
  uri?: string | null;
  width?: number | `${number}%`;
  height: number;
  rounded?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ width: width ?? (height * 16) / 9, height, borderRadius: rounded, overflow: "hidden", backgroundColor: colors.surface3 }, style]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="musical-notes" size={Math.round(height * 0.4)} color={colors.subtle} />
        </View>
      )}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      {icon && <Ionicons name={icon} size={40} color={colors.subtle} style={{ marginBottom: space.lg }} />}
      <Text style={styles.emptyTitle}>{title}</Text>
      {description && <Text style={styles.emptyDesc}>{description}</Text>}
      {action && <View style={{ marginTop: space.xl }}>{action}</View>}
    </View>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <View style={{ paddingVertical: 48, alignItems: "center", gap: space.sm }}>
      <ActivityIndicator color={colors.muted} />
      {label && <Body muted>{label}</Body>}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
  },
  title: { color: colors.text, fontFamily: fonts.black, fontSize: 30, letterSpacing: -0.5 },
  subtitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 18 },
  body: { color: colors.text, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  mono: { color: colors.muted, fontFamily: fonts.mono, fontSize: 12, fontVariant: ["tabular-nums"] },
  badge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  badgeText: { fontSize: 10, fontFamily: fonts.bold, letterSpacing: 1, textTransform: "uppercase" },
  empty: {
    alignItems: "center",
    paddingVertical: 56,
    paddingHorizontal: space.xl,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.line,
    borderRadius: radius.xl,
  },
  emptyTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 18, textAlign: "center" },
  emptyDesc: { color: colors.muted, fontFamily: fonts.regular, fontSize: 14, textAlign: "center", marginTop: 6, maxWidth: 280 },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, padding: space.lg },
});
