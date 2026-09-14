import React, { useEffect } from "react";
import { View } from "react-native";
import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useFonts, Lato_400Regular, Lato_700Bold, Lato_900Black } from "@expo-google-fonts/lato";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { PlayerProvider } from "@/context/PlayerContext";
import PlayerStage from "@/components/PlayerStage";
import { colors } from "@/lib/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.surface, border: colors.line, text: colors.text, primary: colors.text },
};

function Routes() {
  const { status } = useAuth();
  const signedIn = status === "signedIn";

  useEffect(() => {
    if (status !== "loading") SplashScreen.hideAsync().catch(() => {});
  }, [status]);

  if (status === "loading") return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="playlist/[id]" />
        {/* Pushed (not native modals): iOS presents modals above the whole app, which
            would hide the video stage that lives in this root layout. */}
        <Stack.Screen name="player" options={{ animation: "slide_from_bottom", gestureDirection: "vertical" }} />
        <Stack.Screen name="clipping" options={{ animation: "slide_from_bottom", gestureEnabled: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Lato_400Regular, Lato_700Bold, Lato_900Black });
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <ThemeProvider value={theme}>
          <AuthProvider>
            <PlayerProvider>
              <StatusBar style="light" />
              <Routes />
              <PlayerStage />
            </PlayerProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
