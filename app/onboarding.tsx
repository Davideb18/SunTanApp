/**
 * Onboarding Screen — app/onboarding.tsx
 *
 * 4-step linear flow:
 *   Step 0 — Skin Type (Fitzpatrick scale)
 *   Step 1 — Sun Reaction
 *   Step 2 — Base Tan
 *   Step 3 — SPF Protection
 *
 * TODO (Phase 5): Implement full step content, selection logic,
 *                 and store commit + router.replace navigation.
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { GradientBackground } from "@/components/GradientBackground";
import { GlassCard } from "@/components/GlassCard";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.title}>Welcome to{"\n"}SunTanApp ☀️</Text>
        <Text style={styles.subtitle}>Let's set up your skin profile</Text>

        <GlassCard style={styles.card}>
          <View style={styles.cardContent}>
            <Text style={styles.placeholder}>
              Onboarding steps coming in Phase 5 →
            </Text>
          </View>
        </GlassCard>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "rgba(255,255,255,0.7)",
    marginBottom: 32,
  },
  card: {
    flex: 1,
    marginBottom: 120,
  },
  cardContent: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  placeholder: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },
});
