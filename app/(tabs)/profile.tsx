/**
 * Profile Screen — app/(tabs)/profile.tsx
 *
 * Shows the user's skin profile (Fitzpatrick type, SPF, reaction,
 * base tan), allows editing via onboarding, and has premium-gated
 * features (Chronology, Leaderboard).
 *
 * TODO (Phase 8): Implement full profile display, edit navigation,
 *                 reset flow, and premium feature cards.
 */
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientBackground } from "@/components/GradientBackground";
import { GlassCard } from "@/components/GlassCard";
import { useAppStore } from "@/store/useAppStore";
import { FITZPATRICK_TYPES } from "@/constants/theme";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { skinHex, fitzpatrickLevel, currentSpf, sunReaction, baseTan } = useAppStore();

  const skinType = FITZPATRICK_TYPES.find((t) => t.level === fitzpatrickLevel);

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
        <Text style={styles.screenTitle}>Your Profile</Text>

        {/* Skin swatch + level */}
        <GlassCard style={styles.card}>
          <View style={styles.profileRow}>
            {/* Skin color circle */}
            <View
              style={[
                styles.skinCircle,
                { backgroundColor: skinHex ?? "#C68642" },
              ]}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {skinType?.label ?? "Unknown Skin Type"}
              </Text>
              <Text style={styles.profileDetail}>
                Fitzpatrick Type {fitzpatrickLevel ?? "—"}
              </Text>
              <Text style={styles.profileDetail}>SPF {currentSpf}</Text>
            </View>
          </View>
        </GlassCard>

        {/* Settings rows */}
        <GlassCard style={styles.card}>
          <View style={styles.cardContent}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <Text style={styles.placeholder}>
              Full profile edit coming in Phase 8 →
            </Text>
            <Text style={styles.detail}>Sun Reaction: {sunReaction ?? "—"}</Text>
            <Text style={styles.detail}>Base Tan: {baseTan ?? "—"}</Text>
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
    marginBottom: 20,
  },
  card: { marginBottom: 16 },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  skinCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  profileDetail: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.6)",
    marginBottom: 2,
  },
  cardContent: { padding: 20 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.5)",
    marginBottom: 12,
  },
  placeholder: {
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
    marginBottom: 8,
  },
  detail: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
});
