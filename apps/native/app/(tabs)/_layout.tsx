import React from "react";
import { View, type ColorValue } from "react-native";
import { BottomTabBar, Tabs, type BottomTabBarProps } from "expo-router/js-tabs";
import { Ionicons } from "@expo/vector-icons";
import MiniPlayer from "@/components/MiniPlayer";
import { colors, fonts } from "@/lib/theme";

/** The stock tab bar with the mini player docked on top of it. */
function TabBarWithPlayer(props: BottomTabBarProps) {
  return (
    <View>
      <MiniPlayer />
      <BottomTabBar {...props} />
    </View>
  );
}

type Glyph = keyof typeof Ionicons.glyphMap;

function icon(focused: Glyph, idle: Glyph) {
  return function TabBarIcon({ color, focused: isFocused }: { color: ColorValue; focused: boolean }) {
    return <Ionicons name={isFocused ? focused : idle} size={24} color={color} />;
  };
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBarWithPlayer {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.subtle,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.5 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: icon("home", "home-outline") }} />
      <Tabs.Screen name="search" options={{ title: "Search", tabBarIcon: icon("search", "search-outline") }} />
      <Tabs.Screen name="clips" options={{ title: "Clips", tabBarIcon: icon("cut", "cut-outline") }} />
      <Tabs.Screen name="playlists" options={{ title: "Playlists", tabBarIcon: icon("list", "list-outline") }} />
    </Tabs>
  );
}
