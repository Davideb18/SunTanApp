import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
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
import { useAppStore, EngineMode } from "@/store/useAppStore";
import { COLORS, calcSafeSeconds, formatDuration } from "@/constants/theme";

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
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedColor, setDetectedColor] = useState<string | null>(null);

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
    startSession(localMode, personalMinutes * 60);
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
    ? calcSafeSeconds(currentSpf, fitzpatrickLevel || 1, cachedCurrentUv)
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
          paddingTop: insets.top + 15, 
          paddingBottom: insets.bottom + 120, 
          paddingHorizontal: 24,
          alignItems: "center"
        }}
      >
        {!isDone && (
          <View className="mb-2.5 self-start w-full">
            <Text className="text-[32px] font-black tracking-[-1px] text-white">
              {!isIdle ? `Phase ${currentPhaseIndex + 1} of ${sessionPhases.length}` : "Smart Tracker"}
            </Text>
            <View className="mt-0.5 flex-row items-center">
              <ShieldCheck size={12} color={COLORS.accentOrange} style={{ marginRight: 6 }} />
              <Text className="text-[10px] font-black uppercase tracking-[2px] text-white/40">
                {!isIdle ? currentPhase?.label : "Safety-Gated Engine"}
              </Text>
            </View>
          </View>
        )}

        <View className="items-center justify-center w-full my-6">
          <TimerRing 
            progress={!isIdle && !isDone ? (sessionTimeRemaining / (currentPhase?.duration || 1)) : 1}
            subtitle={!isIdle && !isDone ? currentPhase?.label : isDone ? "FINISH" : "READY"}
            timeLabel={!isIdle && !isDone ? formatDuration(sessionTimeRemaining) : formatDuration(idleTimeSeconds)}
            totalTimeLabel={!isIdle && !isDone ? formatDuration(totalElapsedSeconds) : undefined}
            isActive={isSessionActive}
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
                <View className="mt-6 mb-6">
                  {localMode === "coach" ? (
                    <GlassCard style={{ padding: 20, borderWidth: 1, borderColor: "#FFFFFF", backgroundColor: "rgba(0,0,0,0.7)", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 20, elevation: 15 }}>
                      <View className="flex-row items-center mb-3">
                         <Sun size={20} color={COLORS.accentYellow} />
                         <Text className="ml-3 text-lg font-black text-white">Sun Coach</Text>
                      </View>
                      <Text className="text-sm font-medium leading-[22px] text-white/60">
                        Based on your <Text className="font-bold text-white">Skin Type {fitzpatrickLevel}</Text> and current UV of <Text className="font-bold text-white">{cachedCurrentUv.toFixed(1)}</Text>, 
                        we suggest an exposure of <Text className="font-bold text-white">{formatDuration(idleTimeSeconds)}</Text> with 4 rotation phases.
                      </Text>
                    </GlassCard>
                  ) : (
                    <ManualTimePicker value={personalMinutes} onChange={(v) => setPersonalMinutes(v)} />
                  )}
                </View>
                <TouchableOpacity 
                  className="h-16 w-full flex-row items-center justify-center rounded-[24px] bg-white shadow-xl"
                  onPress={handleStart}
                  activeOpacity={0.8}
                >
                  <Play size={20} color="black" />
                  <Text className="ml-3 text-lg font-black text-black">START SESSION</Text>
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
    </GradientBackground>
  );
}
