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
import { useAppStore } from "@/store/useAppStore";
import { CustomTabBar } from "@/components/CustomTabBar";

export default function TabsLayout() {
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);

  // Guard: send to onboarding if profile is not set up
  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="weather" options={{ title: "UV Index" }} />
      <Tabs.Screen name="index" options={{ title: "Tracker" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
