/**
 * Tab Layout — app/(tabs)/_layout.tsx
 *
 * Floating dark bottom-tab bar with 3 tabs:
 *   1. weather  — UV Index     (CloudSun icon)
 *   2. index    — Tracker      (Clock icon) [default]
 *   3. profile  — Profile      (User2 icon)
 *
 * Auth guard: if onboarding is not completed, redirect to /onboarding.
 * The <Redirect> is placed safely inside the Tab navigator (not at root).
 */
import React from "react";
import { Tabs, Redirect } from "expo-router";
import { CloudSun, Clock, User2 } from "lucide-react-native";
import { useAppStore } from "@/store/useAppStore";
import { COLORS } from "@/constants/theme";
import { Platform } from "react-native";

export default function TabsLayout() {
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);

  // Guard: send to onboarding if profile is not set up
  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.tabBarActive,
        tabBarInactiveTintColor: COLORS.tabBarInactive,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 0.5,
          marginBottom: Platform.OS === "ios" ? 0 : 4,
        },
        tabBarStyle: {
          backgroundColor: COLORS.tabBarBg,
          borderTopWidth: 0,
          elevation: 0,
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          borderRadius: 24,
          height: 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 12 : 8,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.5,
          shadowRadius: 16,
        },
      }}
    >
      <Tabs.Screen
        name="weather"
        options={{
          title: "UV Index",
          tabBarIcon: ({ color, size }) => (
            <CloudSun size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Tracker",
          tabBarIcon: ({ color, size }) => (
            <Clock size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <User2 size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}
