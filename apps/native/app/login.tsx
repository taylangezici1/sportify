import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/lib/config";
import { colors, fonts, space } from "@/lib/theme";
import { Button } from "@/components/ui";

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; color: string; text: string }[] = [
  { icon: "cut", color: colors.text, text: "Clip any YouTube Music track with a two-handle slider." },
  { icon: "flame", color: colors.workout, text: "Workout mode shuffles your clips, back to back." },
  { icon: "snow", color: colors.chill, text: "Chill mode shuffles one of your playlists in full." },
];

export default function LoginScreen() {
  const { signIn, signingIn, error } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.logoRow}>
          <View style={styles.logo}>
            <Ionicons name="play" size={22} color="#fff" style={{ marginLeft: 2 }} />
          </View>
          <Text style={styles.brand}>Sportify</Text>
        </View>
        <Text style={styles.headline}>The best 30 seconds{"\n"}of every song.</Text>
        <Text style={styles.lede}>Clips for the gym, playlists for everything else. All from YouTube Music.</Text>

        <View style={{ gap: space.md, marginTop: space.xl }}>
          {FEATURES.map((f) => (
            <View key={f.text} style={styles.feature}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={16} color={f.color} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        {error && <Text style={styles.error}>{error}</Text>}
        <Button title="Continue with Google" variant="primary" size="lg" icon="logo-google" loading={signingIn} onPress={signIn} />
        <Text style={styles.hint}>
          {BACKEND_URL ? `Signs in through ${BACKEND_URL.replace(/^https?:\/\//, "")}` : "EXPO_PUBLIC_BACKEND_URL is not set"}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: space.xl },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: space.xl },
  logo: { width: 40, height: 40, borderRadius: 11, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  brand: { color: colors.text, fontFamily: fonts.black, fontSize: 26 },
  headline: { color: colors.text, fontFamily: fonts.black, fontSize: 36, lineHeight: 40, letterSpacing: -0.5 },
  lede: { color: colors.muted, fontFamily: fonts.regular, fontSize: 16, lineHeight: 22, marginTop: space.md },
  feature: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface3, alignItems: "center", justifyContent: "center" },
  featureText: { color: colors.muted, fontFamily: fonts.regular, fontSize: 14, flex: 1 },
  footer: { padding: space.xl, gap: space.md },
  error: { color: colors.danger, fontFamily: fonts.regular, fontSize: 13, textAlign: "center" },
  hint: { color: colors.subtle, fontFamily: fonts.regular, fontSize: 11, textAlign: "center" },
});
