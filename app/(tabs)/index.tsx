import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
  Play, Pause, X, ChevronRight, ShieldCheck, 
  Check, Sun
} from "lucide-react-native";

import { GradientBackground } from "@/components/GradientBackground";
import { GlassCard } from "@/components/GlassCard";
import { TimerRing } from "@/components/TimerRing";
import { ModeSelector } from "@/components/ModeSelector";
import { ManualTimePicker } from "@/components/ManualTimePicker";
import { SessionRecap } from "@/components/SessionRecap";
import { useRouter } from "expo-router";
import { HeaderButtons } from "../../components/HeaderButtons";
import { PremiumModal } from "../../components/PremiumModal";
import { useAppStore, EngineMode } from "@/store/useAppStore";
import { COLORS, FITZPATRICK_TYPES, formatDuration, getUvBand } from "@/constants/theme";

type CoachIntensity = "gentle" | "balanced" | "strong";

const COACH_INTENSITY_OPTIONS: Array<{ id: CoachIntensity; label: string; hint: string; factor: number }> = [
  { id: "gentle", label: "Gentle", hint: "Longer session", factor: 1.15 },
  { id: "balanced", label: "Balanced", hint: "Recommended", factor: 1 },
  { id: "strong", label: "Strong", hint: "Shorter session", factor: 0.85 },
];

const COACH_CREAM_OPTIONS = [
  { value: 0, label: "No cream" },
  { value: 15, label: "SPF 15" },
  { value: 30, label: "SPF 30" },
  { value: 50, label: "SPF 50" },
];

const COACH_CREAM_MULTIPLIERS: Record<number, number> = {
  0: 1,
  15: 0.9,
  30: 0.8,
  50: 0.68,
};

const getCoachSkinMultiplier = (level: number) => 0.78 + Math.max(1, Math.min(level, 6)) * 0.08;

const getCoachIntensityMultiplier = (intensity: CoachIntensity) => {
  switch (intensity) {
    case "gentle":
      return 1.12;
    case "strong":
      return 0.86;
    case "balanced":
    default:
      return 1;
  }
};

const deriveCoachPlan = (params: {
  baseMinutes: number;
  skinLevel: number;
  creamSpf: number;
  intensity: CoachIntensity;
  uvIndex: number;
}) => {
  if (params.uvIndex <= 0) {
    return {
      effectiveMinutes: 0,
      cycles: 0,
      minutesPerCycle: 0,
      uvFactor: 0,
      skinFactor: 0,
      creamFactor: 0,
      intensityFactor: 0,
      isStopped: true,
    };
  }

  const uvFactor = Math.max(0.6, Math.min(1.35, 10 / Math.max(1, params.uvIndex)));
  const skinFactor = getCoachSkinMultiplier(params.skinLevel);
  const creamFactor = COACH_CREAM_MULTIPLIERS[params.creamSpf] ?? 1;
  const intensityFactor = getCoachIntensityMultiplier(params.intensity);

  const effectiveMinutes = Math.max(
    5,
    Math.round(params.baseMinutes * uvFactor * skinFactor * creamFactor * intensityFactor)
  );

  const targetRotationMinutes = params.intensity === "gentle" ? 12 : params.intensity === "strong" ? 8 : 10;
  const cycles = Math.max(2, Math.min(8, Math.round(effectiveMinutes / targetRotationMinutes)));

  const minutesPerCycle = Math.max(1, Math.round(effectiveMinutes / cycles));

  return {
    effectiveMinutes,
    cycles,
    minutesPerCycle,
    uvFactor,
    skinFactor,
    creamFactor,
    intensityFactor,
    isStopped: false,
  };
};

const getPhaseSuggestion = (type?: string) => {
  switch (type) {
    case "sunscreen": return "Apply generously and evenly. Don't forget ears and neck!";
    case "front": return "Lie on your back, relax and keep your eyes protected.";
    case "back": return "Lie on your stomach. Ensure your shoulders are exposed.";
    case "hydration": return "Time to drink some water! Staying hydrated helps your tan.";
    default: return "Enjoy the sun responsibly and follow the timer.";
  }
};

export default function TrackerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [premiumVisible, setPremiumVisible] = useState(false);
  const [coachCustomizerVisible, setCoachCustomizerVisible] = useState(false);
  const [coachCustomizerTarget, setCoachCustomizerTarget] = useState<"skin" | "uv" | "time" | "cycles" | "cream" | "intensity">("time");
  
  const {
    sessionStatus,
    sessionPhases,
    currentPhaseIndex,
    sessionTimeRemaining,
    sessionTimeTotal,
    isSessionActive,
    currentSessionMode,
    cachedCurrentUv,
    currentSpf,
    fitzpatrickLevel,
    startSession,
    pauseSession,
    resumeSession,
    cancelSession,
    nextPhase,
    tick,
    addSessionToHistory
  } = useAppStore();

  const [localMode, setLocalMode] = useState<EngineMode>("coach");
  const [personalMinutes, setPersonalMinutes] = useState(20);
  const [coachMinutes, setCoachMinutes] = useState(20);
  const [coachSkinLevel, setCoachSkinLevel] = useState(fitzpatrickLevel || 1);
  const [coachCreamSpf, setCoachCreamSpf] = useState(currentSpf);
  const [coachIntensity, setCoachIntensity] = useState<CoachIntensity>("balanced");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedColor, setDetectedColor] = useState<string | null>(null);

  const skinType = FITZPATRICK_TYPES.find((type) => type.level === coachSkinLevel) || FITZPATRICK_TYPES[0];
  const currentUvNumber = Math.round(cachedCurrentUv);
  const uvBand = getUvBand(currentUvNumber);
  const coachPlan = deriveCoachPlan({
    baseMinutes: coachMinutes,
    skinLevel: coachSkinLevel,
    creamSpf: coachCreamSpf,
    intensity: coachIntensity,
    uvIndex: cachedCurrentUv,
  });
  const isUvStopped = Boolean(coachPlan.isStopped);
  const effectiveCoachMinutes = coachPlan.effectiveMinutes;
  const coachCycles = coachPlan.cycles;
  const coachRotationMinutes = coachPlan.minutesPerCycle;

  // Sync tick
  useEffect(() => {
    let interval: any = null;
    if (isSessionActive) {
      interval = setInterval(() => tick(), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isSessionActive, tick]);

  const isIdle = sessionStatus === "idle";
  const isDone = sessionStatus === "done";
  const currentPhase = sessionPhases[currentPhaseIndex];

  const handleStart = () => {
    if (isUvStopped) return;
    const totalSeconds = localMode === "coach" ? effectiveCoachMinutes * 60 : personalMinutes * 60;
    startSession(localMode, totalSeconds, localMode === "coach" ? { cycles: coachCycles } : undefined);
  };

  const handleSaveSession = () => {
    addSessionToHistory({
      mode: currentSessionMode || "coach",
      totalSeconds: sessionTimeTotal,
      uvIndex: cachedCurrentUv,
      vitD: vitD,
      sweatMl: sweatMl,
      imageUri: capturedImage,
      skinColorHex: detectedColor || undefined
    });
    setCapturedImage(null);
    setDetectedColor(null);
    cancelSession(); 
  };

  const idleTimeSeconds = localMode === "coach" 
    ? effectiveCoachMinutes * 60
    : personalMinutes * 60;

  let totalElapsedSeconds = 0;
  if (!isIdle && sessionPhases.length > 0 && currentPhase) {
    for (let i = 0; i < currentPhaseIndex; i++) {
      totalElapsedSeconds += sessionPhases[i].duration;
    }
    totalElapsedSeconds += (currentPhase.duration - sessionTimeRemaining);
  }

  const vitD = Math.floor((totalElapsedSeconds / 60) * (cachedCurrentUv * 50)); 
  const sweatMl = Math.floor((totalElapsedSeconds / 60) * 16.6); 

  return (
    <GradientBackground>
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingTop: insets.top + 28, 
          paddingBottom: insets.bottom + 120, 
          paddingHorizontal: 24,
          alignItems: "center"
        }}
      >
        <View className="mb-10 w-full flex-row items-center justify-between">
          <View className="flex-1 pr-3 items-start">
            <Text className="text-[32px] font-black tracking-[-1px] text-white">Smart Tracker</Text>
            <Text className="mt-1 text-xs font-bold uppercase tracking-[2px] text-white/50">
              {isSessionActive ? "Active Session" : "Ready to Glow"}
            </Text>
          </View>
          <HeaderButtons 
            onEarnPress={() => router.push('/(tabs)/weather?scrollToAmbassador=true')}
            onProPress={() => setPremiumVisible(true)}
          />
        </View>

        <PremiumModal visible={premiumVisible} onClose={() => setPremiumVisible(false)} />

        {!isDone && (
          <View className="mb-2.5 self-start w-full">
            {/* Subtitle removed per request - cleaned UI */}
          </View>
        )}

        <View className="items-center justify-center w-full my-3">
          <TimerRing 
            progress={!isIdle && !isDone ? (sessionTimeRemaining / (currentPhase?.duration || 1)) : 1}
            subtitle={isUvStopped ? "NO UV" : !isIdle && !isDone ? currentPhase?.label : isDone ? "FINISH" : "READY"}
            timeLabel={isUvStopped ? "STOP" : !isIdle && !isDone ? formatDuration(sessionTimeRemaining) : formatDuration(idleTimeSeconds)}
            totalTimeLabel={!isIdle && !isDone ? formatDuration(totalElapsedSeconds) : undefined}
            isActive={isSessionActive}
            size={220}
          />
        </View>

        {isDone ? (
          <View className="w-full">
            <SessionRecap 
              session={{
                mode: currentSessionMode || "coach",
                totalSeconds: sessionTimeTotal,
                uvIndex: cachedCurrentUv,
                vitD: vitD,
                sweatMl: sweatMl,
                imageUri: capturedImage,
                skinColorHex: detectedColor
              }}
              onUpdateImage={(uri, color) => {
                setCapturedImage(uri);
                if (color) setDetectedColor(color);
              }}
            />
          </View>
        ) : (
          <View className="w-full items-center">
            {isIdle ? (
              <View className="w-full">
                <ModeSelector mode={localMode} onChange={(m) => setLocalMode(m)} />
                <View className="mt-10 mb-5">
                  {localMode === "coach" ? (
                    <GlassCard style={{ padding: 14, borderWidth: 1, borderColor: "#FFFFFF", backgroundColor: "rgba(0,0,0,0.7)", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 20, elevation: 15 }}>
                      <View className="flex-row items-center justify-between mb-3">
                         <View className="flex-row items-center">
                           <Sun size={18} color={COLORS.accentYellow} />
                           <Text className="ml-2.5 text-base font-black text-white">Sun Coach</Text>
                         </View>
                         <TouchableOpacity
                           onPress={() => {
                             setCoachCustomizerTarget("time");
                             setCoachCustomizerVisible(true);
                           }}
                           activeOpacity={0.85}
                           className="rounded-full bg-accentYellow px-3.5 py-2"
                         >
                           <Text className="text-[9px] font-black uppercase tracking-[2px] text-black">Customize</Text>
                         </TouchableOpacity>
                      </View>

                      <View className="flex-row gap-2.5">
                        <TouchableOpacity
                          onPress={() => {
                            setCoachCustomizerTarget("skin");
                            setCoachCustomizerVisible(true);
                          }}
                          activeOpacity={0.85}
                          className="flex-1 rounded-[20px] bg-white/5 border border-white/10 p-3.5"
                        >
                          <Text className="text-[9px] font-black uppercase tracking-[2px] text-white/35">Skin Type</Text>
                          <Text className="mt-1 text-[12px] font-black uppercase tracking-[1.5px] text-white">Type {coachSkinLevel}</Text>
                          <View className="mt-3 flex-1 items-center justify-center">
                            <View className="h-14 w-14 rounded-full border border-white/20" style={{ backgroundColor: skinType.hex }} />
                          </View>
                          <Text className="mt-3 text-center text-[11px] font-bold text-white/55">Tap to customize</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            setCoachCustomizerTarget("uv");
                            setCoachCustomizerVisible(true);
                          }}
                          activeOpacity={0.85}
                          className="flex-1 rounded-[20px] bg-white/5 border border-white/10 p-3.5"
                        >
                          <View className="flex-row items-center justify-between">
                            <Text className="text-[9px] font-black uppercase tracking-[2px] text-white/35">Current UV</Text>
                          </View>
                          <View className="mt-3 flex-1 items-center justify-center">
                            <View className="h-14 w-14 rounded-full items-center justify-center border border-white/20 bg-accentYellow shadow-lg">
                              <Text className="text-[18px] font-black text-black">{currentUvNumber}</Text>
                            </View>
                          </View>
                          <Text className="mt-3 text-center text-[9px] font-black uppercase tracking-[1.5px] text-accentYellow">{uvBand.label}</Text>
                          <Text className="mt-3 text-center text-[11px] font-bold text-white/55">Tap to customize</Text>
                        </TouchableOpacity>
                      </View>

                      <View className="mt-2.5 flex-row gap-2.5">
                        <TouchableOpacity
                          onPress={() => {
                            setCoachCustomizerTarget("time");
                            setCoachCustomizerVisible(true);
                          }}
                          activeOpacity={0.85}
                          className="flex-1 rounded-[20px] bg-white/5 border border-white/10 p-3.5"
                        >
                          <Text className="text-[9px] font-black uppercase tracking-[2px] text-white/35">Rotations</Text>
                          <Text className="mt-1.5 text-[22px] font-black text-white">{coachCycles}</Text>
                          <Text className="mt-1 text-[11px] font-bold text-white/55">~{coachRotationMinutes} min each</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            setCoachCustomizerTarget("intensity");
                            setCoachCustomizerVisible(true);
                          }}
                          activeOpacity={0.85}
                          className="flex-1 rounded-[20px] bg-white/5 border border-white/10 p-3.5"
                        >
                          <Text className="text-[9px] font-black uppercase tracking-[2px] text-white/35">Intensity</Text>
                          <Text className="mt-1.5 text-[14px] font-black uppercase text-white">
                            {COACH_INTENSITY_OPTIONS.find((option) => option.id === coachIntensity)?.label ?? "Balanced"}
                          </Text>
                          <Text className="mt-1 text-[11px] font-bold text-white/55">
                            {COACH_INTENSITY_OPTIONS.find((option) => option.id === coachIntensity)?.hint ?? "Recommended"}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View className="mt-3 rounded-[18px] border border-white/10 bg-white/5 px-3.5 py-2.5">
                        <Text className="text-[9px] font-black uppercase tracking-[2px] text-white/35">Actual plan</Text>
                        <Text className="mt-1 text-[12px] font-bold text-white/75" numberOfLines={2}>
                          {isUvStopped
                            ? "STOP • UV is 0, wait for daylight before starting"
                            : `${effectiveCoachMinutes} min • ${coachCycles} rotations • ${coachCreamSpf === 0 ? "No cream" : `SPF ${coachCreamSpf}`} • Type ${coachSkinLevel} • ${COACH_INTENSITY_OPTIONS.find((option) => option.id === coachIntensity)?.label ?? "Balanced"}`}
                        </Text>
                      </View>
                    </GlassCard>
                  ) : (
                    <ManualTimePicker value={personalMinutes} onChange={(v) => setPersonalMinutes(v)} />
                  )}
                </View>
                <TouchableOpacity 
                  className={`h-16 w-full flex-row items-center justify-center rounded-[24px] shadow-xl ${isUvStopped ? "bg-white/15" : "bg-white"}`}
                  onPress={handleStart}
                  disabled={isUvStopped}
                  activeOpacity={0.8}
                >
                  {isUvStopped ? <ShieldCheck size={20} color="white" /> : <Play size={20} color="black" />}
                  <Text className={`ml-3 text-lg font-black ${isUvStopped ? "text-white" : "text-black"}`}>{isUvStopped ? "STOP" : "START SESSION"}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="w-full">
                {/* Phase List */}
                <View className="mb-8 w-full">
                  {sessionPhases.map((phase, idx) => {
                    const isActive = idx === currentPhaseIndex;
                    const isCompleted = idx < currentPhaseIndex;
                    
                    return (
                      <View key={idx} className="mb-4">
                        <GlassCard 
                          style={{ 
                            padding: 20, 
                            borderRadius: 32, 
                            borderWidth: 1.5, 
                            borderColor: isActive ? COLORS.accentYellow : "#FFFFFF",
                            backgroundColor: "rgba(0,0,0,0.7)",
                            opacity: isCompleted ? 0.5 : 1,
                            shadowColor: "#000",
                            shadowOpacity: 0.5,
                            shadowRadius: 15,
                            elevation: 10
                          }}
                        >
                          <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center flex-1">
                              <View className={`h-9 w-9 rounded-full items-center justify-center ${isActive ? 'bg-accentYellow' : 'bg-white/10'}`}>
                                {isCompleted ? (
                                  <Check size={16} color="white" />
                                ) : (
                                  <Text className={`text-[14px] font-black ${isActive ? 'text-black' : 'text-white/40'}`}>{idx + 1}</Text>
                                )}
                              </View>
                              <View className="ml-4 flex-1">
                                <Text className={`text-base font-black ${isActive ? 'text-white' : 'text-white/40'}`}>{phase.label}</Text>
                                {isActive && (
                                  <Text className="text-[11px] font-bold text-accentYellow uppercase tracking-[1px] mt-1">
                                    {getPhaseSuggestion(phase.type)}
                                  </Text>
                                )}
                              </View>
                            </View>
                            <View className={`px-3 py-1.5 rounded-xl border ${isActive ? 'bg-accentYellow/10 border-accentYellow/30' : 'bg-white/5 border-white/10'}`}>
                               <Text className={`text-[11px] font-black ${isActive ? 'text-accentYellow' : 'text-white/40'}`}>
                                 {formatDuration(phase.duration)}
                               </Text>
                            </View>
                          </View>
                        </GlassCard>
                      </View>
                    );
                  })}
                </View>

                <View className="flex-row justify-between gap-4">
                  <TouchableOpacity 
                    className="flex-1 h-16 items-center justify-center rounded-[24px] bg-white/10 border border-white/10" 
                    onPress={cancelSession}
                  >
                    <X size={24} color="white" opacity={0.5} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className="flex-[2] h-16 items-center justify-center rounded-[24px] bg-white shadow-2xl"
                    onPress={isSessionActive ? pauseSession : resumeSession}
                  >
                    <View className="flex-row items-center">
                      {isSessionActive ? <Pause size={22} color="black" /> : <Play size={22} color="black" />}
                      <Text className="ml-3 text-lg font-black text-black">
                        {isSessionActive ? "PAUSE" : "RESUME"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className="flex-1 h-16 items-center justify-center rounded-[24px] bg-white/10 border border-white/10" 
                    onPress={nextPhase}
                  >
                    <ChevronRight size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {isDone && (
          <View className="flex-row justify-between gap-4 mt-8 w-full">
            <TouchableOpacity 
              className="flex-1 h-16 items-center justify-center rounded-[24px] bg-white/10 border border-white/10" 
              onPress={() => {
                cancelSession();
                setCapturedImage(null);
                setDetectedColor(null);
              }}
            >
              <Text className="text-xs font-black text-white/50 tracking-[2px]">DISCARD</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="flex-[2] h-16 items-center justify-center rounded-[24px] bg-accentOrange shadow-2xl"
              onPress={handleSaveSession}
            >
              <View className="flex-row items-center">
                <Check size={22} color="white" />
                <Text className="ml-3 text-lg font-black text-white">SAVE SESSION</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal visible={coachCustomizerVisible} transparent animationType="fade" onRequestClose={() => setCoachCustomizerVisible(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }} onPress={() => setCoachCustomizerVisible(false)}>
          <View className="rounded-t-[36px] bg-[#090909] border-t border-white/10 p-6" style={{ maxHeight: '85%' }} onStartShouldSetResponder={() => true}>
            <View className="flex-row items-center justify-between mb-5">
              <View>
                <Text className="text-[28px] font-black tracking-[-1px] text-white">Customize Coach</Text>
                <Text className="mt-1 text-xs font-bold uppercase tracking-[2px] text-white/50">
                  {coachCustomizerTarget === "skin" ? "Skin Type" : coachCustomizerTarget === "uv" ? "Current UV" : coachCustomizerTarget === "time" ? "Session Time" : coachCustomizerTarget === "cycles" ? "Cycle" : coachCustomizerTarget === "cream" ? "Cream Type" : "Intensity"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setCoachCustomizerVisible(false)} className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <X size={18} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingHorizontal: 6, paddingBottom: 40 }}>

            <View className="mb-5 rounded-[24px] border border-white/10 bg-white/5 p-4">
              <Text className="text-[10px] font-black uppercase tracking-[2px] text-white/40 mb-3">Session Time</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={{ paddingVertical: 4, paddingHorizontal: 6 }}>
                {[-5, -2, 2, 5, 10].map((delta) => (
                  <TouchableOpacity
                    key={delta}
                    onPress={() => {
                      if (isUvStopped) return;
                      setCoachMinutes((value) => Math.max(5, Math.min(180, value + delta)));
                    }}
                    disabled={isUvStopped}
                    className={`min-w-[72px] items-center justify-center rounded-2xl px-3 py-3 mr-3 ${isUvStopped ? "bg-white/5" : "bg-white/10"}`}
                  >
                    <Text className="text-[13px] font-black text-white">{delta > 0 ? `+${delta}` : delta} min</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text className="mt-3 text-center text-[11px] font-medium text-white/50">
                {isUvStopped ? "UV is 0, so the plan is stopped until the sun is available." : `Actual timer: ${effectiveCoachMinutes} min • ${coachCycles} rotations`}
              </Text>
            </View>

            <View className="mb-5 rounded-[24px] border border-white/10 bg-white/5 p-4">
              <Text className="text-[10px] font-black uppercase tracking-[2px] text-white/40 mb-3">Skin Type</Text>
              <View className="flex-row flex-wrap gap-2">
                {FITZPATRICK_TYPES.map((type) => {
                  const active = coachSkinLevel === type.level;
                  return (
                    <TouchableOpacity
                      key={type.level}
                      onPress={() => {
                        setCoachSkinLevel(type.level);
                      }}
                      className={`min-w-[72px] flex-1 items-center rounded-2xl border px-3 py-3 ${active ? "border-accentYellow bg-accentYellow/10" : "border-white/10 bg-white/5"}`}
                    >
                      <View className="h-9 w-9 rounded-full border border-white/20" style={{ backgroundColor: type.hex }} />
                      <Text className={`mt-2 text-[11px] font-black uppercase tracking-[1px] ${active ? "text-accentYellow" : "text-white/70"}`}>Type {type.level}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View className="mb-5 rounded-[24px] border border-white/10 bg-white/5 p-4">
              <Text className="text-[10px] font-black uppercase tracking-[2px] text-white/40 mb-3">Cream Type</Text>
              <View className="flex-row flex-wrap gap-2">
                {COACH_CREAM_OPTIONS.map((option) => {
                  const active = coachCreamSpf === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => {
                        setCoachCreamSpf(option.value);
                      }}
                      className={`min-w-[72px] flex-1 items-center rounded-2xl border px-3 py-3 ${active ? "border-accentYellow bg-accentYellow/10" : "border-white/10 bg-white/5"}`}
                    >
                      <Text className={`text-[12px] font-black uppercase tracking-[1px] ${active ? "text-accentYellow" : "text-white/70"}`}>{option.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View className="mb-5 rounded-[24px] border border-white/10 bg-white/5 p-4">
              <Text className="text-[10px] font-black uppercase tracking-[2px] text-white/40 mb-3">Intensity</Text>
              <View className="flex-row flex-wrap gap-2">
                {COACH_INTENSITY_OPTIONS.map((option) => {
                  const active = coachIntensity === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() => {
                        setCoachIntensity(option.id);
                      }}
                      className={`min-w-[88px] flex-1 rounded-2xl border px-3 py-3 ${active ? "border-accentYellow bg-accentYellow/10" : "border-white/10 bg-white/5"}`}
                    >
                      <Text className={`text-[12px] font-black uppercase tracking-[1px] ${active ? "text-accentYellow" : "text-white/70"}`}>{option.label}</Text>
                      <Text className="mt-1 text-[10px] font-medium text-white/45">{option.hint}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View className="mb-6 rounded-[24px] border border-white/10 bg-white/5 p-4">
              <Text className="text-[10px] font-black uppercase tracking-[2px] text-white/40 mb-3">Rotations</Text>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-4xl font-black text-white">{coachCycles}</Text>
                  <Text className="text-[10px] font-bold uppercase tracking-[2px] text-white/40">auto-calculated</Text>
                </View>
                <View className="items-end">
                  <Text className="text-[11px] font-black uppercase tracking-[2px] text-accentYellow">{coachRotationMinutes} min</Text>
                  <Text className="text-[10px] font-bold text-white/40">per rotation</Text>
                </View>
              </View>
              <Text className="mt-3 text-[11px] font-medium text-white/50">
                Changing minutes, skin, cream or intensity updates rotations automatically.
              </Text>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setCoachMinutes(20);
                  setCoachSkinLevel(fitzpatrickLevel || 1);
                  setCoachCreamSpf(currentSpf);
                  setCoachIntensity("balanced");
                }}
                className="flex-1 items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
              >
                <Text className="text-[11px] font-black uppercase tracking-[2px] text-white/70">Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setCoachCustomizerVisible(false)}
                className="flex-[1.4] items-center rounded-2xl bg-white px-4 py-4"
              >
                <Text className="text-[11px] font-black uppercase tracking-[2px] text-black">Done</Text>
              </TouchableOpacity>
            </View>

            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </GradientBackground>
  );
}
