/**
 * Tab Layout — app/(tabs)/_layout.tsx
 *
 * Floating dark bottom-tab bar with 3 tabs:
 *   1. weather  — UV Index     (CloudSun icon)
 *   2. index    — Tracker      (Clock icon) [default]
 *   3. profile  — Profile      (User2 icon)
 *
 * Auth guard: if onboarding is not completed, redirect to /onboarding.
 *
 * Premium features:
 *   - UpsellBanner: shown every app launch for free users. Dismissed per-session.
 *   - Auto-show PremiumModal: every 3rd app open for free users.
 */
import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { Tabs, Redirect } from "expo-router";
import { useAppStore } from "@/store/useAppStore";
import { CustomTabBar } from "@/components/CustomTabBar";
import { UpsellBanner } from "@/components/UpsellBanner";
import { useTranslation } from "@/constants/i18n";

export default function TabsLayout() {
  const t = useTranslation();
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);
  const hasPremium = useAppStore((s) => s.hasPremium);
  const appOpenCount = useAppStore((s) => s.appOpenCount);
  const incrementAppOpenCount = useAppStore((s) => s.incrementAppOpenCount);
  const premiumVisible = useAppStore((s) => s.premiumVisible);
  const setPremiumVisible = useAppStore((s) => s.setPremiumVisible);
  const ambassadorVisible = useAppStore((s) => s.ambassadorVisible);
  const setAmbassadorVisible = useAppStore((s) => s.setAmbassadorVisible);

  // Banner is visible per-session (in-memory, resets every launch)
  const [bannerVisible, setBannerVisible] = useState(false);

  // Guard: send to onboarding if profile is not set up
  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  useEffect(() => {
    if (hasPremium) return;

    // Increment counter on every app open
    incrementAppOpenCount();

    // Show banner every launch (in-memory state = already false at boot)
    setBannerVisible(true);

    // Auto-show PremiumModal every 3rd app open (after a short delay)
    const newCount = appOpenCount + 1;
    if (newCount % 3 === 0) {
      const timer = setTimeout(() => {
        setPremiumVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []); // runs once on mount = once per app session

  const handleBannerDismiss = () => {
    setBannerVisible(false);
    // Open PremiumModal when user taps the X on the banner
    setTimeout(() => setPremiumVisible(true), 300);
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="weather" options={{ title: t.environment }} />
        <Tabs.Screen name="index" options={{ title: t.tracker }} />
        <Tabs.Screen name="profile" options={{ title: t.myStudio }} />
      </Tabs>

      {/* Upsell Banner — shown every session for free users */}
      {!hasPremium && bannerVisible && (
        <UpsellBanner
          onDismiss={handleBannerDismiss}
          onPress={() => setPremiumVisible(true)}
        />
      )}

    </View>
  );
}
