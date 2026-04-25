import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight, ChevronLeft, ShieldCheck, Check } from "lucide-react-native";
import Animated, {
  SlideInRight,
  SlideOutLeft,
  SlideInLeft,
  SlideOutRight,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
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
import { LegalModal } from "@/components/LegalModal";

const { width } = Dimensions.get("window");

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

/**
 * Premium Progress Bar
 * A vibrant linear bar with a clipped gradient that reveals as progress grows.
 */
const ProgressBar = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => {
  const progress = (currentStep + 1) / totalSteps;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(`${progress * 100}%`),
    };
  });

  return (
    <View className="mx-4 flex-1 mt-5">
      <View className="h-2 overflow-hidden rounded bg-white/15">
        <Animated.View className="h-full overflow-hidden rounded" style={animatedStyle}>
          <LinearGradient
            colors={["#ffb300", "#ef4444"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: "100%", width: "100%" }}
          />
        </Animated.View>
      </View>
      <Text className="mt-2 text-center text-xs font-bold uppercase tracking-[1px] text-white">
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
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [legalVisible, setLegalVisible] = useState(false);
  const [legalType, setLegalType] = useState<"privacy" | "terms">("privacy");
  const totalSteps = 5;

  // Selection state
  const [fitzpatrick, setFitzpatrick] = useState<number | null>(null);
  const [reaction, setReaction] = useState<string | null>(null);
  const [baseTan, setBaseTan] = useState<string | null>(null);
  const [spf, setSpf] = useState<number>(30);

  const handleNext = useCallback(() => {
    if (step < totalSteps - 1) {
      setDirection("forward");
      setTimeout(() => setStep((s) => s + 1), 0);
    } else {
      // Finalize
      if (fitzpatrick && reaction && baseTan && acceptedLegal) {
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
  }, [step, fitzpatrick, reaction, baseTan, spf, acceptedLegal, setSkinProfile, completeOnboarding, router]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      setDirection("backward");
      setTimeout(() => setStep((s) => s - 1), 0);
    }
  }, [step]);

  // Validation
  const canContinue = 
    (step === 0 && acceptedLegal) ||
    (step === 1 && fitzpatrick !== null) ||
    (step === 2 && reaction !== null) ||
    (step === 3 && baseTan !== null) ||
    (step === 4);

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
                <View className="mb-10">
                  <Text className="text-[42px] font-black tracking-[-2px] text-white">GLOWY</Text>
                  <LinearGradient
                    colors={["#ef4444", "#ed9121"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ height: 6, width: 40, borderRadius: 3, marginTop: -2 }}
                  />
                </View>
                <Text className="mb-2 text-[32px] font-black tracking-[-0.5px] text-white">Welcome & Safety</Text>
                <Text className="mb-8 text-base leading-[22px] text-white/70">To ensure your protection and provide the best tanning experience, please review our guidelines.</Text>
                
                <GlassCard style={{ 
                  padding: 20, 
                  borderRadius: 32, 
                  backgroundColor: "rgba(0,0,0,0.4)", 
                  borderWidth: 2, 
                  borderColor: "rgba(255,255,255,0.8)" 
                }}>
                  <View className="flex-row items-center mb-3">
                    <ShieldCheck size={24} color={COLORS.accentYellow} />
                    <Text className="ml-4 text-lg font-black text-white">Legal Agreement</Text>
                  </View>
                  <Text className="text-sm leading-[20px] text-white/60 mb-6">
                    By using Glowy, you agree that environmental data and exposure timers are scientific estimates for guidance. Always follow safe sun practices and your physician's advice.
                  </Text>
                  
                  <TouchableOpacity 
                    onPress={() => setAcceptedLegal(!acceptedLegal)}
                    className="flex-row items-center bg-white/5 p-5 rounded-[24px] border border-white/40"
                    activeOpacity={0.8}
                  >
                    <View className={`h-6 w-6 rounded-md border-2 items-center justify-center ${acceptedLegal ? 'bg-accentYellow border-accentYellow' : 'border-white/40'}`}>
                      {acceptedLegal && <Check size={14} color="black" strokeWidth={4} />}
                    </View>
                    <Text className="ml-4 flex-1 text-sm font-bold text-white">
                      I agree to the{" "}
                      <Text 
                        onPress={() => { setLegalType("terms"); setLegalVisible(true); }}
                        className="text-accentYellow underline"
                      >
                        Terms
                      </Text>{" "}
                      &{" "}
                      <Text 
                        onPress={() => { setLegalType("privacy"); setLegalVisible(true); }}
                        className="text-accentYellow underline"
                      >
                        Privacy Policy
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </GlassCard>
              </>
            )}

            {step === 1 && (
              <>
                <Text className="mb-2 text-[32px] font-black tracking-[-0.5px] text-white">Your Skin Tone</Text>
                <Text className="mb-8 text-base leading-[22px] text-white/70">Select the tone that best matches your skin</Text>
                <ScrollView 
                  showsVerticalScrollIndicator={false} 
                  contentContainerStyle={{ paddingBottom: 160 }}
                >
                  <View className="flex-row flex-wrap justify-between">
                    {FITZPATRICK_TYPES.map((type) => (
                      <TouchableOpacity 
                        key={type.level} 
                        onPress={() => setFitzpatrick(type.level)}
                        style={{ width: 170, height: 170, marginBottom: 6  }}
                        activeOpacity={0.8}
                      >
                        <GlassCard 
                          style={{
                            flex: 1,
                            padding: 16,
                            borderRadius: 32,
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: fitzpatrick === type.level ? 3 : 2,
                            borderColor: fitzpatrick === type.level ? COLORS.accentYellow : "rgba(255,255,255,0.8)",
                            backgroundColor: fitzpatrick === type.level ? "rgba(255,222,0,0.15)" : "rgba(0,0,0,0.4)",
                            shadowColor: fitzpatrick === type.level ? COLORS.accentYellow : "transparent",
                            shadowOpacity: 0.6,
                            shadowRadius: 15,
                            elevation: fitzpatrick === type.level ? 10 : 0
                          }}
                        >
                          <View 
                            className="h-20 w-20 rounded-full items-center justify-center shadow-lg"
                            style={{ 
                              backgroundColor: type.hex,
                              shadowColor: "#000",
                              shadowOpacity: 0.3,
                              shadowRadius: 5
                            }}
                          >
                            {fitzpatrick === type.level && (
                              <View className="bg-black/20 p-2 rounded-full">
                                <Check color="white" size={24} strokeWidth={4} />
                              </View>
                            )}
                          </View>
                          <Text 
                            className="mt-4 text-[12px] font-black text-center uppercase tracking-[2px]"
                            style={{ color: fitzpatrick === type.level ? COLORS.accentYellow : "rgba(255,255,255,0.7)" }}
                          >
                            Type {type.level}
                          </Text>
                        </GlassCard>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}

            {step === 2 && (
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
                          borderRadius: 32,
                          borderWidth: reaction === opt.id ? 3 : 2,
                          borderColor: reaction === opt.id ? COLORS.accentYellow : "rgba(255,255,255,0.8)",
                          backgroundColor: reaction === opt.id ? "rgba(255,222,0,0.15)" : "rgba(0,0,0,0.4)",
                          shadowColor: reaction === opt.id ? COLORS.accentYellow : "transparent",
                          shadowOpacity: 0.6,
                          shadowRadius: 15,
                          elevation: reaction === opt.id ? 10 : 0
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
                          borderRadius: 32,
                          borderWidth: baseTan === opt.id ? 3 : 2,
                          borderColor: baseTan === opt.id ? COLORS.accentYellow : "rgba(255,255,255,0.8)",
                          backgroundColor: baseTan === opt.id ? "rgba(255,222,0,0.15)" : "rgba(0,0,0,0.4)",
                          shadowColor: baseTan === opt.id ? COLORS.accentYellow : "transparent",
                          shadowOpacity: 0.6,
                          shadowRadius: 15,
                          elevation: baseTan === opt.id ? 10 : 0
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

            {step === 4 && (
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
                        style={{ width: 170, height: 170, marginBottom: 6 }}
                        activeOpacity={0.8}
                      >
                          <GlassCard 
                            style={{
                              flex: 1,
                              borderRadius: 32,
                              alignItems: "center",
                              justifyContent: "center",
                              padding: 20,
                              borderWidth: spf === opt.value ? 3 : 2,
                              borderColor: spf === opt.value ? COLORS.accentYellow : "rgba(255,255,255,0.8)",
                              backgroundColor: spf === opt.value ? "rgba(255,222,0,0.15)" : "rgba(0,0,0,0.4)",
                              shadowColor: spf === opt.value ? COLORS.accentYellow : "transparent",
                              shadowOpacity: 0.6,
                              shadowRadius: 15,
                              elevation: spf === opt.value ? 10 : 0
                            }}
                          >
                            <Text 
                              className="font-black text-center"
                              style={{
                                fontSize: 42,
                                color: spf === opt.value ? COLORS.accentYellow : "#FFF",
                                lineHeight: 48
                              }}
                            >
                              {opt.label}
                            </Text>
                            {opt.value !== 0 && (
                              <Text className="text-[10px] font-black text-center uppercase text-white/40 tracking-[2px]">
                                SPF FACTOR
                              </Text>
                            )}
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

        <LegalModal 
          visible={legalVisible} 
          type={legalType} 
          onClose={() => setLegalVisible(false)} 
        />
      </View>
    </GradientBackground>
  );
}
