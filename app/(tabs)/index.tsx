/**
 * Tracker Screen — app/(tabs)/index.tsx
 *
 * Smart Timer Engine with dual mode (Coach / Personal).
 * Implements the full session state machine:
 *   IDLE → SUNSCREEN → FRONT → FLIP → BACK → DONE
 *
 * TODO (Phase 7): Implement state machine, interval engine, wheel picker,
 *                 coach formula, TimerRing integration, and overlay states.
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientBackground } from "@/components/GradientBackground";
import { GlassCard } from "@/components/GlassCard";
import { TimerRing } from "@/components/TimerRing";

export default function TrackerScreen() {
  const insets = useSafeAreaInsets();

  return (
    <GradientBackground>
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 96 },
        ]}
      >
        {/* Header */}
        <Text style={styles.screenTitle}>Tanning Tracker</Text>
        <Text style={styles.subtitle}>Coach • Personal</Text>

        {/* Timer ring preview */}
        <View style={styles.ringWrapper}>
          <TimerRing
            progress={0.75}
            timeLabel="0m 45s"
            subtitle="FRONT SIDE"
            isActive={false}
          />
        </View>

        {/* Status / controls placeholder */}
        <GlassCard style={styles.card}>
          <View style={styles.cardContent}>
            <Text style={styles.placeholder}>
              State machine coming in Phase 7 →
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
    alignItems: "center",
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    alignSelf: "flex-start",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.5)",
    alignSelf: "flex-start",
    marginBottom: 32,
  },
  ringWrapper: {
    marginBottom: 32,
  },
  card: {
    width: "100%",
  },
  cardContent: {
    padding: 24,
    alignItems: "center",
  },
  placeholder: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },
});
