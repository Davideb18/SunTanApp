/**
 * Weather Screen — app/(tabs)/weather.tsx
 *
 * Displays live UV index data fetched from Open-Meteo using the
 * device's GPS coordinates. Shows a horizontal timeline of UV bars
 * similar to Apple Weather.
 *
 * TODO (Phase 6): Implement location fetch, Open-Meteo API call,
 *                 UV timeline ScrollView, and UvBar rendering.
 */
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientBackground } from "@/components/GradientBackground";
import { GlassCard } from "@/components/GlassCard";

export default function WeatherScreen() {
  const insets = useSafeAreaInsets();

  return (
    <GradientBackground>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 96 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.screenTitle}>UV Index</Text>
        <Text style={styles.locationLabel}>Fetching location…</Text>

        {/* Current UV card placeholder */}
        <GlassCard style={styles.uvCard}>
          <View style={styles.cardContent}>
            <Text style={styles.uvNumber}>—</Text>
            <Text style={styles.uvCategory}>Fetching UV…</Text>
          </View>
        </GlassCard>

        {/* Timeline placeholder */}
        <GlassCard style={styles.timelineCard}>
          <View style={styles.cardContent}>
            <Text style={styles.placeholder}>
              UV timeline coming in Phase 6 →
            </Text>
          </View>
        </GlassCard>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24 },
  screenTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.6)",
    marginBottom: 20,
  },
  uvCard: { marginBottom: 16 },
  timelineCard: { marginBottom: 16 },
  cardContent: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  uvNumber: {
    fontSize: 72,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: 80,
  },
  uvCategory: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  placeholder: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },
});
