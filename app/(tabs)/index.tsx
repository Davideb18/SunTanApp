import React, { useEffect, useState, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
  Play, Pause, X, ChevronRight, ShieldCheck, 
  Check, Sun, Settings, Droplet
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
import Svg, { Circle } from "react-native-svg";
import { useTranslation } from "@/constants/i18n";
import { SettingsModal } from "@/components/SettingsModal";
import { AmbassadorModal } from "@/components/AmbassadorModal";

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
  15: 1.5,
  30: 2.2,
  50: 3.5,
};

const getCoachSkinMultiplier = (level: number) => {
  const multipliers: Record<number, number> = {
    1: 0.6,   // Very fair: less time
    2: 1.0,   // Fair: baseline
    3: 1.5,   // Medium
    4: 2.2,   // Olive
    5: 3.2,   // Dark Brown
    6: 5.0,   // Black: much more time
  };
  return multipliers[level] || 1.0;
};

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

const MiniProgress = ({ progress, isActive, isCompleted, onPress }: { progress: number, isActive: boolean, isCompleted: boolean, onPress: () => void }) => {
  const size = 52;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - Math.max(0, Math.min(1, progress)) * circumference;

  return (
    <TouchableOpacity onPress={onPress} disabled={!isActive} className="items-center justify-center" style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isActive ? "rgba(255,222,0,0.15)" : "rgba(255,255,255,0.05)"}
          strokeWidth={strokeWidth}
          fill={isCompleted ? COLORS.accentYellow : "transparent"}
        />
        {isActive && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={COLORS.accentYellow}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      <View className="items-center justify-center">
        {isCompleted ? (
          <Check size={24} color="black" strokeWidth={3} />
        ) : isActive ? (
          <View className="h-4 w-4 bg-accentYellow rounded-full shadow-md" />
        ) : (
          <View className="h-2 w-2 bg-white/20 rounded-full" />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function TrackerScreen() {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [premiumVisible, setPremiumVisible] = useState(false);
  const [ambassadorVisible, setAmbassadorVisible] = useState(false);
  const [coachCustomizerVisible, setCoachCustomizerVisible] = useState(false);
  const [coachCustomizerTarget, setCoachCustomizerTarget] = useState<"skin" | "uv" | "time" | "cycles" | "cream" | "intensity">("time");

  const getUvLabel = (label: string) => {
    const key = label.toLowerCase().replace(" ", "") as keyof typeof t;
    return (t as any)[key] || label;
  };
  
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
    addSessionToHistory,
    dailyGoalMinutes,
    hasPremium,
    history,
    vitDGoalIU
  } = useAppStore();

  const weeklyVitD = useMemo(() => {
    return history
      .filter(s => (new Date().getTime() - new Date(s.date).getTime()) <= 7 * 24 * 60 * 60 * 1000)
      .reduce((acc, s) => acc + (s.vitD || 0), 0);
  }, [history]);

  const [localMode, setLocalMode] = useState<EngineMode>("personal");
  const [personalMinutes, setPersonalMinutes] = useState(dailyGoalMinutes || 20);
  const [coachMinutes, setCoachMinutes] = useState(20);
  const [coachSkinLevel, setCoachSkinLevel] = useState(fitzpatrickLevel || 1);
  const [coachCreamSpf, setCoachCreamSpf] = useState(currentSpf);
  const [coachIntensity, setCoachIntensity] = useState<CoachIntensity>("balanced");

  useEffect(() => {
    setCoachSkinLevel(fitzpatrickLevel || 1);
  }, [fitzpatrickLevel]);

  useEffect(() => {
    setCoachCreamSpf(currentSpf);
  }, [currentSpf]);

  useEffect(() => {
    if (dailyGoalMinutes) {
      setPersonalMinutes(dailyGoalMinutes);
    }
  }, [dailyGoalMinutes]);
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

  const getVitDEfficiency = (level: number) => {
    const factors: Record<number, number> = {
      1: 1.2,
      2: 1.0,
      3: 0.7,
      4: 0.4,
      5: 0.25,
      6: 0.15,
    };
    return factors[level] || 0.7;
  };

  const skinEfficiency = getVitDEfficiency(coachSkinLevel);
  const vitD = Math.floor((totalElapsedSeconds / 60) * (cachedCurrentUv * 25 * skinEfficiency)); 
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
            <Text className="text-[24px] font-black tracking-[-0.5px] text-white">{t.tracker}</Text>
            <Text className="mt-1 text-xs font-bold uppercase tracking-[2px] text-white/50">
              {isSessionActive ? t.activeSession : (t.language === 'it' ? "Pronto a splendere" : "Ready to Glow")}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <HeaderButtons 
              onPartnerPress={() => setAmbassadorVisible(true)}
              onProPress={() => setPremiumVisible(true)}
            />
            <TouchableOpacity 
              onPress={() => setSettingsVisible(true)}
              className="h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/10"
            >
              <Settings size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <PremiumModal visible={premiumVisible} onClose={() => setPremiumVisible(false)} />
        <AmbassadorModal visible={ambassadorVisible} onClose={() => setAmbassadorVisible(false)} />

        {(isIdle || isDone) && (
          <View className="items-center justify-center w-full my-3">
            <TimerRing 
              progress={!isIdle && !isDone ? (sessionTimeRemaining / (currentPhase?.duration || 1)) : 1}
              subtitle={isUvStopped ? t.noUv : !isIdle && !isDone ? currentPhase?.label : isDone ? t.finish : t.ready}
              timeLabel={isUvStopped ? t.stop : !isIdle && !isDone ? formatDuration(sessionTimeRemaining) : formatDuration(idleTimeSeconds)}
              totalTimeLabel={!isIdle && !isDone ? formatDuration(totalElapsedSeconds) : undefined}
              isActive={isSessionActive}
              size={220}
            />
          </View>
        )}

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
                <ModeSelector 
                  mode={localMode} 
                  coachLocked={!hasPremium}
                  onChange={(m) => {
                    if (m === "coach" && !hasPremium) {
                      setPremiumVisible(true);
                    } else {
                      setLocalMode(m);
                    }
                  }} 
                />
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
                          <Text className="mt-3 text-center text-[11px] font-bold text-white/55">{t.tapToCustomize}</Text>
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
                            <Text className="text-[9px] font-black uppercase tracking-[2px] text-white/35">{t.currentUv}</Text>
                          </View>
                          <View className="mt-3 flex-1 items-center justify-center">
                            <View className="h-14 w-14 rounded-full items-center justify-center border border-white/20 bg-accentYellow shadow-lg">
                              <Text className="text-[18px] font-black text-black">{currentUvNumber}</Text>
                            </View>
                          </View>
                          <Text className="mt-3 text-center text-[9px] font-black uppercase tracking-[1.5px] text-accentYellow">
                            {getUvLabel(uvBand.label)}
                          </Text>
                          <Text className="mt-3 text-center text-[11px] font-bold text-white/55">{t.tapToCustomize}</Text>
                        </TouchableOpacity>
                      </View>

                      <View className="mt-2.5 flex-row gap-2.5">
                        <TouchableOpacity
                          onPress={() => {
                            setCoachCustomizerTarget("cycles");
                            setCoachCustomizerVisible(true);
                          }}
                          activeOpacity={0.85}
                          className="flex-1 rounded-[20px] bg-white/5 border border-white/10 p-3.5"
                        >
                          <Text className="text-[9px] font-black uppercase tracking-[2px] text-white/35">{t.cycles}</Text>
                          <Text className="mt-1.5 text-[22px] font-black text-white">{coachCycles}</Text>
                          <Text className="mt-1 text-[11px] font-bold text-white/55">~{coachRotationMinutes} {t.minEach}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            setCoachCustomizerTarget("intensity");
                            setCoachCustomizerVisible(true);
                          }}
                          activeOpacity={0.85}
                          className="flex-1 rounded-[20px] bg-white/5 border border-white/10 p-3.5"
                        >
                          <Text className="text-[9px] font-black uppercase tracking-[2px] text-white/35">{t.intensityLabel}</Text>
                          <Text className="mt-1.5 text-[14px] font-black uppercase text-white">
                            {t[coachIntensity as keyof typeof t] || "Balanced"}
                          </Text>
                          <Text className="mt-1 text-[11px] font-bold text-white/55">
                            {coachIntensity === 'balanced' ? t.recommended : coachIntensity === 'gentle' ? t.longerSession : t.shorterSession}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View className="mt-3 rounded-[18px] border border-white/10 bg-white/5 px-3.5 py-2.5">
                        <Text className="text-[9px] font-black uppercase tracking-[2px] text-white/35">{t.actualPlan}</Text>
                        <Text className="mt-1 text-[12px] font-bold text-white/75" numberOfLines={2}>
                          {isUvStopped
                            ? t.stopNoUvDesc
                            : `${effectiveCoachMinutes} min • ${coachCycles} ${t.cycles.toLowerCase()} • ${coachCreamSpf === 0 ? t.noCream : `SPF ${coachCreamSpf}`} • ${t.type} ${coachSkinLevel} • ${t[coachIntensity as keyof typeof t] || "Balanced"}`}
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
                  <Text className={`ml-3 text-lg font-black ${isUvStopped ? "text-white" : "text-black"}`}>{isUvStopped ? t.stop : t.startSession}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
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
              <Text className="text-xs font-black text-white/50 tracking-[2px]">{t.discard}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="flex-[2] h-16 items-center justify-center rounded-[24px] bg-accentOrange shadow-2xl"
              onPress={handleSaveSession}
            >
              <View className="flex-row items-center">
                <Check size={22} color="white" />
                <Text className="ml-3 text-lg font-black text-white">{t.saveSession}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal visible={!isIdle && !isDone} animationType="slide" transparent>
        <View className="flex-1 bg-black">
          <GradientBackground>
            <View className="flex-1 px-6" style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }}>
              <View className="flex-row justify-center items-center mb-6">
                <Text className="text-right text-[10px] font-bold text-white/40 uppercase tracking-[1px]">{weeklyVitD.toLocaleString()} / {vitDGoalIU.toLocaleString()} {t.language === 'it' ? "UI" : "IU"}</Text>
              </View>

              <View className="items-center justify-center w-full mb-8 mt-2">
                <TimerRing 
                  progress={sessionTimeRemaining / (currentPhase?.duration || 1)}
                  subtitle={currentPhase?.label || ""}
                  timeLabel={formatDuration(sessionTimeRemaining)}
                  totalTimeLabel={formatDuration(totalElapsedSeconds)}
                  isActive={isSessionActive}
                  size={240}
                />
                
                <View className="flex-row items-center gap-4 mt-6">
                  <View className="flex-row items-center bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl">
                    <Sun size={14} color={COLORS.accentYellow} />
                    <Text className="ml-2 text-[13px] font-black text-white">{vitD} <Text className="text-[10px] text-white/50">{t.language === 'it' ? "UI" : "IU"}</Text></Text>
                  </View>
                  <View className="flex-row items-center bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl">
                    <Droplet size={14} color="#60A5FA" />
                    <Text className="ml-2 text-[13px] font-black text-white">{(sweatMl / 1000).toFixed(2)} <Text className="text-[10px] text-white/50">L</Text></Text>
                  </View>
                </View>
              </View>

              <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {sessionPhases.map((phase, idx) => {
                  const isActive = idx === currentPhaseIndex;
                  const isCompleted = idx < currentPhaseIndex;
                  const phaseProgress = isActive ? 1 - (sessionTimeRemaining / phase.duration) : (isCompleted ? 1 : 0);
                  
                  return (
                    <View key={idx} className="mb-4">
                      <GlassCard 
                        style={{ 
                          padding: 16, 
                          borderRadius: 28, 
                          borderWidth: isActive ? 1.5 : 1, 
                          borderColor: isActive ? COLORS.accentYellow : "rgba(255,255,255,0.1)",
                          backgroundColor: isActive ? "rgba(255,222,0,0.08)" : "rgba(0,0,0,0.5)",
                          opacity: isCompleted ? 0.3 : 1,
                          shadowColor: isActive ? COLORS.accentYellow : "#000",
                          shadowOpacity: isActive ? 0.2 : 0,
                          shadowRadius: 15,
                          elevation: isActive ? 10 : 0
                        }}
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center flex-1">
                            <MiniProgress 
                              progress={phaseProgress}
                              isActive={isActive}
                              isCompleted={isCompleted}
                              onPress={nextPhase}
                            />
                            <View className="ml-4 flex-1">
                              <Text className={`text-[17px] font-black ${isActive ? 'text-white' : 'text-white/60'}`}>{phase.label}</Text>
                              {isActive && (
                                <Text className="text-[10px] font-bold text-accentYellow uppercase tracking-[1px] mt-1.5 leading-[14px]">
                                  {(() => {
                                    if (phase.type === "front") return t.suggestionFront;
                                    if (phase.type === "back") return t.suggestionBack;
                                    return t.suggestionSide;
                                  })()}
                                </Text>
                              )}
                            </View>
                          </View>
                          <View className={`px-3 py-1.5 rounded-[12px] border ${isActive ? 'bg-accentYellow/10 border-accentYellow/30' : 'bg-white/5 border-white/10'}`}>
                             <Text className={`text-[11px] font-black tracking-[1px] ${isActive ? 'text-accentYellow' : 'text-white/40'}`}>
                               {formatDuration(phase.duration)}
                             </Text>
                          </View>
                        </View>
                      </GlassCard>
                    </View>
                  );
                })}
              </ScrollView>

              <View className="flex-row justify-between gap-4 mt-4">
                <TouchableOpacity 
                  className="h-16 w-16 items-center justify-center rounded-full bg-white/10 border border-white/20" 
                  onPress={cancelSession}
                >
                  <X size={24} color="white" opacity={0.6} />
                </TouchableOpacity>

                <TouchableOpacity 
                  className="h-16 w-16 items-center justify-center rounded-full bg-white/10 border border-white/20" 
                  onPress={isSessionActive ? pauseSession : resumeSession}
                >
                  {isSessionActive ? <Pause size={24} color="white" /> : <Play size={24} color="white" />}
                </TouchableOpacity>

                <TouchableOpacity 
                  className="flex-1 h-16 flex-row items-center justify-center rounded-[32px] bg-accentYellow shadow-lg shadow-accentYellow/30"
                  onPress={nextPhase}
                >
                  {currentPhaseIndex === sessionPhases.length - 1 ? (
                    <Text className="text-[15px] font-black text-black tracking-[1px]">{t.finish}</Text>
                  ) : (
                    <Check size={30} color="black" strokeWidth={3.5} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </GradientBackground>
        </View>
      </Modal>

      <Modal visible={coachCustomizerVisible} transparent animationType="fade" onRequestClose={() => setCoachCustomizerVisible(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }} onPress={() => setCoachCustomizerVisible(false)}>
          <View className="rounded-t-[36px] bg-[#090909] border-t border-white/10 p-6" style={{ maxHeight: '85%' }} onStartShouldSetResponder={() => true}>
            <View className="flex-row items-center justify-between mb-5">
              <View>
                <Text className="text-[28px] font-black tracking-[-1px] text-white">{t.customizeCoach}</Text>
                <Text className="mt-1 text-xs font-bold uppercase tracking-[2px] text-white/50">
                  {coachCustomizerTarget === "skin" ? t.yourSkinTone : coachCustomizerTarget === "uv" ? t.currentUv : coachCustomizerTarget === "time" ? t.sessionTime : coachCustomizerTarget === "cycles" ? t.cycles : coachCustomizerTarget === "cream" ? t.creamType : t.intensityLabel}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setCoachCustomizerVisible(false)} className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <X size={18} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingHorizontal: 6, paddingBottom: 40 }}>

            <View className="mb-5 rounded-[24px] border border-white/10 bg-white/5 p-4">
              <Text className="text-[10px] font-black uppercase tracking-[2px] text-white/40 mb-3">{t.sessionTime}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={{ paddingVertical: 4, paddingHorizontal: 6 }}>
                {[-5, -2, 2, 5, 10].map((delta) => (
                  <TouchableOpacity
                    key={delta}
                    onPress={() => {
                      if (isUvStopped) return;
                      setCoachMinutes((value: number) => Math.max(5, Math.min(180, value + delta)));
                    }}
                    disabled={isUvStopped}
                    className={`min-w-[72px] items-center justify-center rounded-2xl px-3 py-3 mr-3 ${isUvStopped ? "bg-white/5" : "bg-white/10"}`}
                  >
                    <Text className="text-[13px] font-black text-white">{delta > 0 ? `+${delta}` : delta} min</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text className="mt-3 text-center text-[11px] font-medium text-white/50">
                {isUvStopped 
                  ? (t.language === 'it' ? "UV a 0, il piano è fermo finché non sorge il sole." : "UV is 0, so the plan is stopped until the sun is available.") 
                  : (t.language === 'it' ? `Timer attuale: ${effectiveCoachMinutes} min • ${coachCycles} rotazioni` : `Actual timer: ${effectiveCoachMinutes} min • ${coachCycles} rotations`)}
              </Text>
            </View>

            <View className="mb-5 rounded-[24px] border border-white/10 bg-white/5 p-4">
              <Text className="text-[10px] font-black uppercase tracking-[2px] text-white/40 mb-3">{t.yourSkinTone}</Text>
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
                      <Text className={`mt-2 text-[11px] font-black uppercase tracking-[1px] ${active ? "text-accentYellow" : "text-white/70"}`}>{t.type} {type.level}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View className="mb-5 rounded-[24px] border border-white/10 bg-white/5 p-4">
              <Text className="text-[10px] font-black uppercase tracking-[2px] text-white/40 mb-3">{t.creamType}</Text>
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
              <Text className="text-[10px] font-black uppercase tracking-[2px] text-white/40 mb-3">{t.intensityLabel}</Text>
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
              <Text className="text-[10px] font-black uppercase tracking-[2px] text-white/40 mb-3">{t.rotations}</Text>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-4xl font-black text-white">{coachCycles}</Text>
                  <Text className="text-[10px] font-bold uppercase tracking-[2px] text-white/40">{t.autoCalculated}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-[11px] font-black uppercase tracking-[2px] text-accentYellow">{coachRotationMinutes} min</Text>
                  <Text className="text-[10px] font-bold text-white/40">{t.perRotation}</Text>
                </View>
              </View>
              <Text className="mt-3 text-[11px] font-medium text-white/50">
                {t.language === 'it' ? "Cambiare i minuti, la pelle, la crema o l'intensità aggiorna le rotazioni automaticamente." : "Changing minutes, skin, cream or intensity updates rotations automatically."}
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
                <Text className="text-[11px] font-black uppercase tracking-[2px] text-white/70">{t.reset}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setCoachCustomizerVisible(false)}
                className="flex-[1.4] items-center rounded-2xl bg-white px-4 py-4"
              >
                <Text className="text-[11px] font-black uppercase tracking-[2px] text-black">{t.done}</Text>
              </TouchableOpacity>
            </View>

            </ScrollView>
          </View>
        </Pressable>
      </Modal>
      <SettingsModal 
        visible={settingsVisible} 
        onClose={() => setSettingsVisible(false)} 
      />
    </GradientBackground>
  );
}
