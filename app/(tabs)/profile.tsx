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
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientBackground } from "@/components/GradientBackground";
import { GlassCard } from "@/components/GlassCard";
import { useAppStore } from "@/store/useAppStore";
import { FITZPATRICK_TYPES, COLORS } from "@/constants/theme";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { skinHex, fitzpatrickLevel, currentSpf, sunReaction, baseTan, resetProfile } = useAppStore();

  const skinType = FITZPATRICK_TYPES.find((t) => t.level === fitzpatrickLevel);

  return (
    <GradientBackground>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 96, paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-5 text-[32px] font-black tracking-[-0.5px] text-white">Your Profile</Text>

        {/* Skin swatch + level */}
        <GlassCard style={{ marginBottom: 16 }}>
          <View className="flex-row items-center gap-4 p-5">
            {/* Skin color circle */}
            <View
              className="h-16 w-16 rounded-full border-2 border-white/30"
              style={{ backgroundColor: skinHex ?? "#C68642" }}
            />
            <View className="flex-1">
              <Text className="mb-1 text-xl font-extrabold text-white">
                {skinType?.label ?? "Unknown Skin Type"}
              </Text>
              <Text className="mb-0.5 text-[13px] font-medium text-white/60">
                Fitzpatrick Type {fitzpatrickLevel ?? "—"}
              </Text>
              <Text className="mb-0.5 text-[13px] font-medium text-white/60">SPF {currentSpf}</Text>
            </View>
          </View>
        </GlassCard>

        {/* Settings rows */}
        <GlassCard style={{ marginBottom: 16 }}>
          <View className="p-5">
            <Text className="mb-3 text-sm font-extrabold uppercase tracking-[2px] text-white/50">Settings</Text>
            <Text className="mb-2 text-[13px] text-white/40">
              Full profile edit coming in Phase 8 →
            </Text>
            <Text className="mb-1 text-sm font-semibold text-white">Sun Reaction: {sunReaction ?? "—"}</Text>
            <Text className="mb-1 text-sm font-semibold text-white">Base Tan: {baseTan ?? "—"}</Text>

            <TouchableOpacity 
              onPress={resetProfile} 
              className="mt-6 items-center rounded-xl border border-white/20 bg-white/10 py-3"
              activeOpacity={0.7}
            >
              <Text style={{ color: COLORS.accentRed }} className="text-sm font-bold">
                Reset Profile & Restart Onboarding
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </ScrollView>
    </GradientBackground>
  );
}
