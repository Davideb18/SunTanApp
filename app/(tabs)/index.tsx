import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert, Image, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
  Play, Pause, X, ChevronRight, RotateCcw, ShieldCheck, 
  UserCircle, Check, Camera, Image as ImageIcon, History,
  Sun, Droplets, Zap, Clock
} from "lucide-react-native";
import * as ImagePicker from 'expo-image-picker';

import { GradientBackground } from "@/components/GradientBackground";
import { GlassCard } from "@/components/GlassCard";
import { TimerRing } from "@/components/TimerRing";
import { ModeSelector } from "@/components/ModeSelector";
import { ManualTimePicker } from "@/components/ManualTimePicker";
import { useAppStore } from "@/store/useAppStore";
import { COLORS, calcSafeSeconds, formatDuration } from "@/constants/theme";
import { fetchWeatherData } from "@/utils/weather";

const getPhaseSuggestion = (type?: string) => {
  switch (type) {
    case "sunscreen": return "Apply generously and evenly. Don't forget ears and neck!";
    case "front": return "Lie on your back, relax and keep your eyes protected.";
    case "back": return "Lie on your stomach. Ensure your shoulders are exposed.";
    case "flip": return "Time to change position for an even tan.";
    case "hydration": return "Drink at least a glass of water to stay hydrated.";
    case "cooldown": return "Find some shade to let your skin rest.";
    default: return "Relax and enjoy safely.";
  }
};

export default function TrackerScreen() {
  const insets = useSafeAreaInsets();
  
  // Store state
  const { 
    fitzpatrickLevel, 
    currentSpf, 
    cachedCurrentUv, 
    currentTemp,
    feelsLikeTemp,
    lastEngineMode,
    sessionStatus,
    currentPhaseIndex,
    sessionPhases,
    sessionTimeRemaining,
    sessionTimeTotal,
    isSessionActive,
    currentSessionMode,
    setLastEngineMode,
    startSession,
    pauseSession,
    resumeSession,
    cancelSession,
    nextPhase,
    tick,
    setWeatherData,
    addSessionToHistory
  } = useAppStore();

  // Local state for setup
  const [localMode, setLocalMode] = useState<"coach" | "personal">(lastEngineMode);
  const [personalMinutes, setPersonalMinutes] = useState(20);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // ── Timer Engine ────────────────────────────────────────────────────────
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (isSessionActive && sessionStatus === "active") {
      interval = setInterval(() => {
        tick();
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSessionActive, sessionStatus]);

  // Fetch weather data on mount to ensure real data is shown
  useEffect(() => {
    const initWeather = async () => {
      try {
        const data = await fetchWeatherData();
        setWeatherData(data);
      } catch (err) {
        console.error("Tracker weather fetch error:", err);
      }
    };
    initWeather();
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────
  const handleStart = () => {
    let totalSeconds = 0;
    
    if (localMode === "coach") {
      if (fitzpatrickLevel === null) {
        Alert.alert("Profile Incomplete", "Please set up your skin profile in the settings tab first.");
        return;
      }
      totalSeconds = calcSafeSeconds(currentSpf, fitzpatrickLevel, cachedCurrentUv);
    } else {
      totalSeconds = personalMinutes * 60;
    }
    
    setLastEngineMode(localMode);
    startSession(localMode, totalSeconds);
    setCapturedImage(null); // Reset image for new session
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission denied", "We need camera access to take a progress photo.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
    }
  };

  const handleSaveSession = () => {
    addSessionToHistory({
      totalSeconds: sessionTimeTotal,
      mode: currentSessionMode || "personal",
      uvIndex: cachedCurrentUv,
      vitD: vitD,
      sweatMl: sweatMl,
      imageUri: capturedImage || undefined,
    });
    cancelSession(); // Reset state to idle
    setCapturedImage(null);
    Alert.alert("Session Saved", "Your tanning session has been added to history.");
  };

  // ── UI Helpers ──────────────────────────────────────────────────────────
  const isIdle = sessionStatus === "idle";
  const isDone = sessionStatus === "done";
  
  const currentPhase = sessionPhases[currentPhaseIndex];
  const totalPhases = sessionPhases.length;

  const displayProgress = currentPhase 
    ? sessionTimeRemaining / currentPhase.duration 
    : 1;

  const idleTimeSeconds = localMode === "coach" 
    ? calcSafeSeconds(currentSpf, fitzpatrickLevel || 1, cachedCurrentUv)
    : personalMinutes * 60;

  // Calculate total elapsed seconds correctly across all phases
  let totalElapsedSeconds = 0;
  if (!isIdle && sessionPhases.length > 0 && currentPhase) {
    for (let i = 0; i < currentPhaseIndex; i++) {
      totalElapsedSeconds += sessionPhases[i].duration;
    }
    totalElapsedSeconds += (currentPhase.duration - sessionTimeRemaining);
  }

  // Scientific estimates
  // Vit D: ~50 IU per minute per UV index point
  const vitD = Math.floor((totalElapsedSeconds / 60) * (cachedCurrentUv * 50)); 
  // Sweat: ~16.6 ml per minute in direct sun (approx 1L per hour)
  const sweatMl = Math.floor((totalElapsedSeconds / 60) * 16.6); 

  return (
    <GradientBackground>
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingTop: insets.top + 15, 
          paddingBottom: insets.bottom + 120, // Space for nav bar
          paddingHorizontal: 24,
          alignItems: "center"
        }}
      >
        {/* Header - Hidden when done */}
        {!isDone && (
          <View className="mb-2.5 self-start w-full">
            <Text className="text-[32px] font-black tracking-[-1px] text-white">Smart Tracker</Text>
            <View className="mt-0.5 flex-row items-center">
              <ShieldCheck size={12} color={COLORS.accentOrange} style={{ marginRight: 6 }} />
              <Text className="text-xs font-bold uppercase tracking-[2px]" style={{ color: COLORS.accentOrange }}>
                {isIdle ? "SAFETY-GATED ENGINE" : `PHASE ${currentPhaseIndex + 1} OF ${totalPhases}`}
              </Text>
            </View>
          </View>
        )}

        {/* Center Section: Ring (STATIONARY) - Hidden when done */}
        {!isDone && (
          <View className="mb-4 mt-2 items-center w-full relative">
            <TimerRing
              size={220}
              progress={isIdle ? 1 : displayProgress}
              timeLabel={isIdle ? formatDuration(idleTimeSeconds) : formatDuration(sessionTimeRemaining)}
              subtitle={isIdle ? "READY" : currentPhase?.label.toUpperCase() || "DONE"}
              totalTimeLabel={!isIdle && !isDone ? formatDuration(totalElapsedSeconds) : undefined}
              isActive={isSessionActive}
            />
          </View>
        )}

        {isDone ? (
          // RECAP / DONE VIEW - MASSIVE SQUARE TILES
          <View className="w-full flex-1 justify-center py-6">
            <View className="items-center mb-10">
              <View className="bg-red-500/30 px-6 py-2 rounded-full border border-red-500/50 mb-4">
                <Text className="text-sm font-black text-white uppercase tracking-[6px] text-center">Mission Accomplished</Text>
              </View>
              <Text 
                className="text-8xl font-black tracking-[-3px] text-white text-center px-4"
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                RECAP
              </Text>
            </View>

            {/* Massive Square Metric Tiles */}
            <View className="flex-row flex-wrap justify-between gap-y-3 mb-10">
              {[
                { label: "Duration", value: formatDuration(sessionTimeTotal), icon: Clock },
                { label: "UV Peak", value: cachedCurrentUv.toString(), icon: Sun },
                { label: "Vitamin D", value: `${vitD} IU`, icon: Zap },
                { label: "Hydration", value: `${sweatMl} ML`, icon: Droplets },
              ].map((stat, i) => (
                <View key={i} className="w-[48.5%] aspect-[1.5] rounded-[30px] overflow-hidden shadow-2xl" style={{ shadowColor: COLORS.accentRed, shadowOpacity: 0.7, shadowRadius: 35 }}>
                  <LinearGradient
                    colors={i % 2 === 0 ? [COLORS.accentRed, "#ff3333"] : ["#ff3333", COLORS.accentOrange]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="flex-1 items-center justify-center p-6"
                  >
                    <View className="h-16 w-16 rounded-full bg-white/10 items-center justify-center mb-4">
                      <stat.icon size={28} color="white" />
                    </View>
                    <Text className="text-[12px] font-black text-white/60 tracking-[2px] uppercase text-center mb-1">{stat.label}</Text>
                    <Text className="text-3xl font-black text-white text-center tracking-[-1px] mb-6">{stat.value}</Text>
                  </LinearGradient>
                </View>
              ))}
            </View>

            {/* Photo Section - Tight placement */}
            <View className="mb-6  mt-12 items-center">
              {capturedImage ? (
                <View className="relative">
                  <Image source={{ uri: capturedImage }} className="h-44 w-44 rounded-[50px] border-4 border-white/40 shadow-2xl" />
                  <TouchableOpacity 
                    className="absolute -top-1 -right-1 h-10 w-10 rounded-full bg-red-600 items-center justify-center border-4 border-[#121212]"
                    onPress={() => setCapturedImage(null)}
                  >
                    <X size={20} color="white" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  className="w-full h-24 rounded-[36px] border-2 border-white/30 bg-white/10 items-center justify-center"
                  onPress={takePhoto}
                >
                  <View className="flex-row items-center">
                    <Camera size={26} color="white" />
                    <Text className="ml-3 text-sm font-black text-white uppercase tracking-[2px]">Capture your glow</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Action Buttons */}
            <View className="flex-row justify-between gap-4">
              <TouchableOpacity 
                className="flex-1 h-16 items-center justify-center rounded-[24px] bg-white/10 border border-white/10" 
                onPress={() => {
                  cancelSession();
                  setCapturedImage(null);
                }}
              >
                <Text className="text-xs font-black text-white/50 tracking-[2px]">DISCARD</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="flex-[2] h-16 flex-row items-center justify-center rounded-[24px] bg-white shadow-2xl"
                onPress={handleSaveSession}
              >
                <Check size={22} color="black" />
                <Text className="ml-2 text-base font-black text-black tracking-[1px]">SAVE TO LOG</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <GlassCard style={{ width: "100%", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }}>
            {/* Bottom Sheet Handle Indicator */}
            <View className="items-center w-full pt-3 pb-1">
               <View className="w-10 h-1.5 rounded-full bg-white/10" />
            </View>
            
            <View className="min-h-[280px] justify-center px-4 pb-[18px]">
              {isIdle ? (
                // SETUP VIEW
                <View className="w-full items-center">
                  <ModeSelector mode={localMode} onChange={setLocalMode} />
                  
                  <View className="my-6 w-full justify-center">
                    {localMode === "coach" ? (
                      <View className="w-full items-center">
                        <View className="mb-1 flex-row items-center">
                           <UserCircle size={14} color="rgba(255,255,255,0.4)" />
                           <Text className="ml-1.5 text-[9px] font-black tracking-[1.5px] text-white/30">COACH PREVIEW</Text>
                        </View>
                        <Text className="my-0.5 text-5xl font-black tracking-[-2px] text-white">
                          {formatDuration(calcSafeSeconds(currentSpf, fitzpatrickLevel || 1, cachedCurrentUv))}
                        </Text>
                        <View className="mt-1 rounded-xl bg-white/5 px-3 py-1.5">
                          <Text className="text-center text-xs font-bold text-white/40">Safe UV {cachedCurrentUv} • SPF {currentSpf}</Text>
                        </View>
                      </View>
                    ) : (
                      <View className="w-full items-center">
                        <View className="mb-3 flex-row items-center">
                           <Clock size={14} color="rgba(255,255,255,0.4)" />
                           <Text className="ml-1.5 text-[10px] font-black tracking-[2px] text-white/40 uppercase">Select Duration</Text>
                        </View>
                        <ManualTimePicker value={personalMinutes} onChange={setPersonalMinutes} />
                      </View>
                    )}
                  </View>
  
                  <TouchableOpacity
                    className="mt-0.5 flex-row items-center rounded-[20px] bg-accentYellow px-[30px] py-[15px]"
                    style={{
                      shadowColor: COLORS.accentYellow,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 6,
                    }}
                    onPress={handleStart}
                    activeOpacity={0.8}
                  >
                     <Play size={20} color="#000000" fill="#000000" />
                     <Text className="ml-2 text-sm font-black tracking-[0.5px] text-black">START SESSION</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // ACTIVE VIEW
                <View className="w-full items-center">
                  <Text className="text-[28px] font-black text-white text-center mb-1">
                    {currentPhase?.label.toUpperCase() || "ACTIVE"}
                  </Text>
                  <Text className="text-[16px] font-bold text-white/70 text-center mb-6 px-4 leading-[22px]">
                    {getPhaseSuggestion(currentPhase?.type)}
                  </Text>
  
                  <View className="w-full flex-row items-center justify-between px-6 mb-5">
                    <TouchableOpacity
                      className="h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/10"
                      onPress={cancelSession}
                    >
                      <X size={24} color="#FFFFFF" />
                    </TouchableOpacity>
   
                    <TouchableOpacity 
                      className="h-[76px] w-[76px] items-center justify-center rounded-full bg-accentYellow"
                      style={{
                        shadowColor: COLORS.accentYellow,
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.3,
                        shadowRadius: 10,
                        elevation: 6,
                      }}
                      onPress={isSessionActive ? pauseSession : resumeSession}
                    >
                      {isSessionActive ? <Pause size={32} color="#000000" fill="#000000" /> : <Play size={32} color="#000000" fill="#000000" />}
                    </TouchableOpacity>
   
                    <TouchableOpacity
                      className="h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/10"
                      onPress={nextPhase}
                    >
                      <Check size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Real-time Indicators */}
                  <View className="w-full bg-white/5 rounded-3xl p-4 border border-white/10 mb-4">
                    {/* Top Row */}
                    <View className="flex-row justify-between mb-4 border-b border-white/5 pb-4">
                      <View className="items-center flex-1 border-r border-white/5">
                        <Text className="text-[10px] text-white/40 font-black tracking-widest mb-1 uppercase">UV INDEX</Text>
                        <Text className="text-[18px] text-white font-black">{cachedCurrentUv}</Text>
                      </View>
                      <View className="items-center flex-1 border-r border-white/5">
                        <Text className="text-[10px] text-white/40 font-black tracking-widest mb-1 uppercase">TEMP</Text>
                        <Text className="text-[18px] text-white font-black">{currentTemp.toFixed(0)}°</Text>
                      </View>
                      <View className="items-center flex-1">
                        <Text className="text-[10px] text-white/40 font-black tracking-widest mb-1 uppercase">FEELS</Text>
                        <Text className="text-[18px] text-white font-black">{feelsLikeTemp.toFixed(0)}°</Text>
                      </View>
                    </View>
                    
                    {/* Bottom Row */}
                    <View className="flex-row justify-around">
                      <View className="items-center flex-1 border-r border-white/5">
                        <Text className="text-[10px] text-white/40 font-black tracking-widest mb-1 uppercase">VITAMIN D</Text>
                        <Text className="text-[18px] font-black" style={{ color: COLORS.Yellow }}>
                          {vitD} <Text className="text-[11px]" style={{ color: "rgba(255,166,0,0.5)" }}>IU</Text>
                        </Text>
                      </View>
                      <View className="items-center flex-1">
                        <Text className="text-[10px] text-white/40 font-black tracking-widest mb-1 uppercase">WATER LOST</Text>
                        <Text className="text-[18px] font-black text-[#60A5FA]">
                          {sweatMl} <Text className="text-[11px] text-[#60A5FA]/50">ML</Text>
                        </Text>
                      </View>
                    </View>
                  </View>
  
                  {sessionPhases[currentPhaseIndex + 1] ? (
                    <View className="flex-row items-center mt-1">
                      <Text className="text-[10px] font-bold text-white/40 uppercase tracking-[1px] mr-2">UP NEXT:</Text>
                      <Text className="text-[11px] font-black text-white/80">
                        {sessionPhases[currentPhaseIndex + 1].label}
                      </Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center mt-1">
                      <Text className="text-[10px] font-bold text-white/40 uppercase tracking-[1px] mr-2">UP NEXT:</Text>
                      <Text className="text-[11px] font-black text-white/80">FINISH</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </GlassCard>
        )}
      </ScrollView>
    </GradientBackground>
  );
}
