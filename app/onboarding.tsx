import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight, ChevronLeft } from "lucide-react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  SlideInLeft,
  SlideOutRight,
  useAnimatedStyle,
  withSpring,
  withTiming,
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

const { width } = Dimensions.get("window");

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
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, animatedStyle]} />
      </View>
      <Text style={styles.progressText}>
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
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        
        {/* Header & Progress */}
        <View style={styles.header}>
          {step > 0 ? (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft color="#FFF" size={28} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 28 }} />
          )}
          <ProgressBar currentStep={step} totalSteps={totalSteps} />
          <View style={{ width: 28 }} />
        </View>

        {/* Dynamic Content Area */}
        <View style={styles.content}>
          <Animated.View 
            key={step} 
            entering={EnteringAnimation.duration(400)} 
            exiting={ExitingAnimation.duration(400)} 
            style={styles.stepWrapper}
          >
            {step === 0 && (
              <>
                <Text style={styles.title}>Your Skin Tone</Text>
                <Text style={styles.subtitle}>Select the tone that best matches your skin</Text>
                <ScrollView 
                  showsVerticalScrollIndicator={false} 
                  contentContainerStyle={styles.scrollWithFooter}
                >
                  <View style={styles.swatchGrid}>
                    {FITZPATRICK_TYPES.map((t) => (
                      <TouchableOpacity
                        key={t.level}
                        onPress={() => setFitzpatrick(t.level)}
                        style={[
                          styles.swatchItem,
                          fitzpatrick === t.level && styles.swatchItemSelected,
                        ]}
                      >
                        <View style={[styles.swatchCircle, { backgroundColor: t.hex }]} />
                        <Text style={[styles.swatchLabel, fitzpatrick === t.level && styles.textAccent]}>
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
                <Text style={styles.title}>Sun Reaction</Text>
                <Text style={styles.subtitle}>How does your skin react to direct sunlight?</Text>
                <ScrollView 
                  showsVerticalScrollIndicator={false} 
                  contentContainerStyle={styles.scrollWithFooter}
                >
                  {SUN_REACTION_OPTIONS.map((opt) => (
                    <TouchableOpacity key={opt.id} onPress={() => setReaction(opt.id)} activeOpacity={0.8}>
                      <GlassCard 
                        style={[
                          styles.optionCard,
                          reaction === opt.id && styles.optionCardSelected
                        ]}
                      >
                        <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                        <View style={styles.optionTextContainer}>
                          <Text style={styles.optionLabel}>{opt.label}</Text>
                          <Text style={styles.optionDescription}>{opt.description}</Text>
                        </View>
                      </GlassCard>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {step === 2 && (
              <>
                <Text style={styles.title}>Current Tan</Text>
                <Text style={styles.subtitle}>What is your current base tan level?</Text>
                <ScrollView 
                  showsVerticalScrollIndicator={false} 
                  contentContainerStyle={styles.scrollWithFooter}
                >
                  {BASE_TAN_OPTIONS.map((opt) => (
                    <TouchableOpacity key={opt.id} onPress={() => setBaseTan(opt.id)} activeOpacity={0.8}>
                      <GlassCard 
                        style={[
                          styles.optionCard,
                          baseTan === opt.id && styles.optionCardSelected
                        ]}
                      >
                        <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                        <View style={styles.optionTextContainer}>
                          <Text style={styles.optionLabel}>{opt.label}</Text>
                          <Text style={styles.optionDescription}>{opt.description}</Text>
                        </View>
                      </GlassCard>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {step === 3 && (
              <>
                <Text style={styles.title}>Preferred SPF</Text>
                <Text style={styles.subtitle}>Which protection factor will you use today?</Text>
                <ScrollView 
                  showsVerticalScrollIndicator={false} 
                  contentContainerStyle={styles.scrollWithFooter}
                >
                  <View style={styles.spfGrid}>
                    {SPF_OPTIONS.map((opt) => (
                      <TouchableOpacity 
                        key={opt.value + opt.label} 
                        onPress={() => setSpf(opt.value)} 
                        style={styles.spfItemWrapper}
                      >
                        <GlassCard 
                          style={[
                            styles.spfCard,
                            spf === opt.value && styles.spfCardSelected
                          ]}
                        >
                          <Text 
                            style={[
                              styles.spfLabel, 
                              spf === opt.value && styles.textAccent,
                              opt.value === 0 && { fontSize: 28 } // Adjusted font for "None"
                            ]}
                          >
                            {opt.label}
                          </Text>
                          {opt.value !== 0 && <Text style={styles.spfSubLabel}>SPF</Text>}
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
        <View style={styles.footerContainer} pointerEvents="box-none">
          <View style={[styles.footerContent, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity
              onPress={handleNext}
              disabled={!canContinue}
              style={[styles.nextButton, !canContinue && styles.disabledButton]}
            >
              <Text style={styles.nextButtonText}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 40,
    height: 60,
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  progressTrack: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.accentYellow,
    borderRadius: 4,
  },
  progressText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 8,
    textAlign: "center",
    letterSpacing: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  content: {
    flex: 1,
  },
  stepWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFF",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 32,
    lineHeight: 22,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  swatchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  swatchItem: {
    width: "45%",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  swatchItemSelected: {
    borderColor: COLORS.accentYellow,
    backgroundColor: "rgba(255,222,0,0.15)",
  },
  swatchCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  swatchLabel: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  optionCardSelected: {
    borderColor: COLORS.accentYellow,
    backgroundColor: "rgba(255,222,0,0.1)",
  },
  optionEmoji: {
    fontSize: 32,
    marginRight: 20,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
  },
  spfGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  spfItemWrapper: {
    width: "47%",
    marginBottom: 16,
  },
  spfCard: {
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  spfCardSelected: {
    borderColor: COLORS.accentYellow,
    backgroundColor: "rgba(255,222,0,0.15)",
  },
  spfLabel: {
    fontSize: 42,
    fontWeight: "900",
    color: "#FFF",
  },
  spfSubLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    marginTop: -4,
  },
  textAccent: {
    color: COLORS.accentYellow,
  },
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: "transparent",
    justifyContent: "center",
  },
  footerContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  scrollWithFooter: {
    paddingBottom: 160,
  },
  nextButton: {
    backgroundColor: COLORS.accentYellow,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 20,
    shadowColor: COLORS.accentYellow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.tabBarBg,
    marginRight: 8,
  },
});
