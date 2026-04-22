import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight, ChevronLeft } from "lucide-react-native";
import Animated, {
  SlideInRight,
  SlideOutLeft,
  SlideInLeft,
  SlideOutRight,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppStore } from "@/store/useAppStore";
import {
  FITZPATRICK_TYPES,
  SUN_REACTION_OPTIONS,
  BASE_TAN_OPTIONS,
  SPF_OPTIONS,
  COLORS,
} from "@/constants/theme";
import { GradientBackground } from "@/components/GradientBackground";
import { GlassCard } from "@/components/GlassCard";

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

/**
 * Premium Progress Bar
 * A simple, vibrant linear bar that fills with the app's signature yellow.
 */
const ProgressBar = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => {
  const progress = (currentStep + 1) / totalSteps;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(`${progress * 100}%`),
    };
  });

  return (
    <View className="mx-4 flex-1">
      <View className="h-2 overflow-hidden rounded bg-white/15">
        <Animated.View className="h-full rounded bg-accentYellow" style={animatedStyle} />
      </View>
      <Text className="mt-2 text-center text-xs font-bold uppercase tracking-[1px] text-white/50">
        Step {currentStep + 1} of {totalSteps}
      </Text>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setSkinProfile = useAppStore((state) => state.setSkinProfile);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const totalSteps = 4;

  // Selection state
  const [fitzpatrick, setFitzpatrick] = useState<number | null>(null);
  const [reaction, setReaction] = useState<string | null>(null);
  const [baseTan, setBaseTan] = useState<string | null>(null);
  const [spf, setSpf] = useState<number>(30);

  const handleNext = useCallback(() => {
    if (step < totalSteps - 1) {
      setDirection("forward");
      // Use a small delay to ensure the exit animation direction is updated before the step change
      setTimeout(() => setStep((s) => s + 1), 0);
    } else {
      // Finalize
      if (fitzpatrick && reaction && baseTan) {
        const selectedType = FITZPATRICK_TYPES.find((t) => t.level === fitzpatrick);
        setSkinProfile({
          skinHex: selectedType?.hex || "#FFFFFF",
          fitzpatrickLevel: fitzpatrick,
          sunReaction: reaction,
          baseTan: baseTan,
          currentSpf: spf,
        });
        completeOnboarding();
        router.replace("/(tabs)");
      }
    }
  }, [step, fitzpatrick, reaction, baseTan, spf, setSkinProfile, completeOnboarding, router]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      setDirection("backward");
      // Use a small delay to ensure the exit animation direction is updated before the step change
      setTimeout(() => setStep((s) => s - 1), 0);
    }
  }, [step]);

  // Validation
  const canContinue = 
    (step === 0 && fitzpatrick !== null) ||
    (step === 1 && reaction !== null) ||
    (step === 2 && baseTan !== null) ||
    (step === 3);

  // Animation mapping - Standardized for all steps
  const EnteringAnimation = direction === "forward" ? SlideInRight : SlideInLeft;
  const ExitingAnimation = direction === "forward" ? SlideOutLeft : SlideOutRight;

  return (
    <GradientBackground>
      <View className="flex-1 px-6" style={{ paddingTop: insets.top + 20 }}>
        
        {/* Header & Progress */}
        <View className="mb-10 h-[60px] flex-row items-center justify-between">
          {step > 0 ? (
            <TouchableOpacity onPress={handleBack} className="-ml-2 p-2">
              <ChevronLeft color="#FFF" size={28} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 28 }} />
          )}
          <ProgressBar currentStep={step} totalSteps={totalSteps} />
          <View style={{ width: 28 }} />
        </View>

        {/* Dynamic Content Area */}
        <View className="flex-1">
          <Animated.View 
            key={step} 
            entering={EnteringAnimation.duration(400)} 
            exiting={ExitingAnimation.duration(400)} 
            className="flex-1"
          >
            {step === 0 && (
              <>
                <Text className="mb-2 text-[32px] font-black tracking-[-0.5px] text-white">Your Skin Tone</Text>
                <Text className="mb-8 text-base leading-[22px] text-white/70">Select the tone that best matches your skin</Text>
                <ScrollView 
                  showsVerticalScrollIndicator={false} 
                  contentContainerStyle={{ paddingBottom: 160 }}
                >
                  <View className="flex-row flex-wrap justify-between">
                    {FITZPATRICK_TYPES.map((t) => (
                      <TouchableOpacity
                        key={t.level}
                        onPress={() => setFitzpatrick(t.level)}
                        className="mb-4 w-[45%] items-center rounded-[20px] border p-4"
                        style={{
                          backgroundColor: fitzpatrick === t.level ? "rgba(255,222,0,0.15)" : "rgba(255,255,255,0.1)",
                          borderColor: fitzpatrick === t.level ? COLORS.accentYellow : "transparent",
                        }}
                      >
                        <View
                          className="mb-3 h-[60px] w-[60px] rounded-full"
                          style={{
                            backgroundColor: t.hex,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 5,
                            elevation: 5,
                          }}
                        />
                        <Text className="text-sm font-semibold" style={{ color: fitzpatrick === t.level ? COLORS.accentYellow : "#FFF" }}>
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}

            {step === 1 && (
              <>
                <Text className="mb-2 text-[32px] font-black tracking-[-0.5px] text-white">Sun Reaction</Text>
                <Text className="mb-8 text-base leading-[22px] text-white/70">How does your skin react to direct sunlight?</Text>
                <ScrollView 
                  showsVerticalScrollIndicator={false} 
                  contentContainerStyle={{ paddingBottom: 160 }}
                >
                  {SUN_REACTION_OPTIONS.map((opt) => (
                    <TouchableOpacity key={opt.id} onPress={() => setReaction(opt.id)} activeOpacity={0.8}>
                      <GlassCard 
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          padding: 20,
                          marginBottom: 12,
                          borderWidth: 1,
                          borderColor: reaction === opt.id ? COLORS.accentYellow : "transparent",
                          backgroundColor: reaction === opt.id ? "rgba(255,222,0,0.1)" : undefined,
                        }}
                      >
                        <Text className="mr-5 text-[32px]">{opt.emoji}</Text>
                        <View className="flex-1">
                          <Text className="mb-1 text-lg font-bold text-white">{opt.label}</Text>
                          <Text className="text-sm text-white/60">{opt.description}</Text>
                        </View>
                      </GlassCard>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {step === 2 && (
              <>
                <Text className="mb-2 text-[32px] font-black tracking-[-0.5px] text-white">Current Tan</Text>
                <Text className="mb-8 text-base leading-[22px] text-white/70">What is your current base tan level?</Text>
                <ScrollView 
                  showsVerticalScrollIndicator={false} 
                  contentContainerStyle={{ paddingBottom: 160 }}
                >
                  {BASE_TAN_OPTIONS.map((opt) => (
                    <TouchableOpacity key={opt.id} onPress={() => setBaseTan(opt.id)} activeOpacity={0.8}>
                      <GlassCard 
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          padding: 20,
                          marginBottom: 12,
                          borderWidth: 1,
                          borderColor: baseTan === opt.id ? COLORS.accentYellow : "transparent",
                          backgroundColor: baseTan === opt.id ? "rgba(255,222,0,0.1)" : undefined,
                        }}
                      >
                        <Text className="mr-5 text-[32px]">{opt.emoji}</Text>
                        <View className="flex-1">
                          <Text className="mb-1 text-lg font-bold text-white">{opt.label}</Text>
                          <Text className="text-sm text-white/60">{opt.description}</Text>
                        </View>
                      </GlassCard>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {step === 3 && (
              <>
                <Text className="mb-2 text-[32px] font-black tracking-[-0.5px] text-white">Preferred SPF</Text>
                <Text className="mb-8 text-base leading-[22px] text-white/70">Which protection factor will you use today?</Text>
                <ScrollView 
                  showsVerticalScrollIndicator={false} 
                  contentContainerStyle={{ paddingBottom: 160 }}
                >
                  <View className="flex-row flex-wrap justify-between">
                    {SPF_OPTIONS.map((opt) => (
                      <TouchableOpacity 
                        key={opt.value + opt.label} 
                        onPress={() => setSpf(opt.value)} 
                        className="mb-4 w-[47%]"
                      >
                        <GlassCard 
                          style={{
                            height: 140,
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 1,
                            borderColor: spf === opt.value ? COLORS.accentYellow : "transparent",
                            backgroundColor: spf === opt.value ? "rgba(255,222,0,0.15)" : undefined,
                          }}
                        >
                          <Text 
                            className="font-black text-white"
                            style={{
                              fontSize: opt.value === 0 ? 28 : 42,
                              color: spf === opt.value ? COLORS.accentYellow : "#FFF",
                            }}
                          >
                            {opt.label}
                          </Text>
                          {opt.value !== 0 && <Text className="-mt-1 text-sm font-bold uppercase text-white/50">SPF</Text>}
                        </GlassCard>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}
          </Animated.View>
        </View>

        {/* Footer Action */}
        <View className="absolute bottom-0 left-0 right-0 h-[140px] justify-center bg-transparent" pointerEvents="box-none">
          <View className="px-6 pt-6" style={{ paddingBottom: insets.bottom + 20 }}> 
            <TouchableOpacity
              onPress={handleNext}
              disabled={!canContinue}
              className="flex-row items-center justify-center rounded-[20px] py-[18px]"
              style={{
                backgroundColor: canContinue ? COLORS.accentYellow : "rgba(255,255,255,0.3)",
                opacity: canContinue ? 1 : 0.5,
                shadowColor: COLORS.accentYellow,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 15,
                elevation: 10,
              }}
            >
              <Text className="mr-2 text-lg font-extrabold" style={{ color: COLORS.tabBarBg }}>
                {step === totalSteps - 1 ? "Start Tanning" : "Continue"}
              </Text>
              <ChevronRight color={COLORS.tabBarBg} size={24} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </GradientBackground>
  );
}
