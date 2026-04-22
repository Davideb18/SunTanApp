import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Play, Pause, X, ChevronRight, RotateCcw, ShieldCheck, UserCircle } from "lucide-react-native";

import { GradientBackground } from "@/components/GradientBackground";
import { GlassCard } from "@/components/GlassCard";
import { TimerRing } from "@/components/TimerRing";
import { ModeSelector } from "@/components/ModeSelector";
import { ManualTimePicker } from "@/components/ManualTimePicker";
import { useAppStore } from "@/store/useAppStore";
import { COLORS, calcSafeSeconds, formatDuration } from "@/constants/theme";

export default function TrackerScreen() {
  const insets = useSafeAreaInsets();
  
  // Store state
  const { 
    fitzpatrickLevel, 
    currentSpf, 
    cachedCurrentUv, 
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
    tick
  } = useAppStore();

  // Local state for setup
  const [localMode, setLocalMode] = useState<"coach" | "personal">(lastEngineMode);
  const [personalMinutes, setPersonalMinutes] = useState(20);

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
  };

  // ── UI Helpers ──────────────────────────────────────────────────────────
  const isIdle = sessionStatus === "idle";
  const isDone = sessionStatus === "done";
  
  const currentPhase = sessionPhases[currentPhaseIndex];
  const totalPhases = sessionPhases.length;

  const displayProgress = currentPhase 
    ? sessionTimeRemaining / currentPhase.duration 
    : 1;

  return (
    <GradientBackground>
      <View 
        className="flex-1 items-center px-6"
        style={{ paddingTop: insets.top + 15, paddingBottom: insets.bottom + 5 }}
      >
        {/* Header */}
        <View className="mb-2.5 self-start">
          <Text className="text-[32px] font-black tracking-[-1px] text-white">Smart Tracker</Text>
          <View className="mt-0.5 flex-row items-center">
            <ShieldCheck size={12} color={COLORS.accentOrange} style={{ marginRight: 6 }} />
            <Text className="text-xs font-bold uppercase tracking-[2px]" style={{ color: COLORS.accentOrange }}>
              {isIdle ? "SAFETY-GATED ENGINE" : `PHASE ${currentPhaseIndex + 1} OF ${totalPhases}`}
            </Text>
          </View>
        </View>

        {/* Center Section: Ring (STATIONARY) */}
        <View className="mb-5 mt-2.5">
          <TimerRing
            size={250}
            progress={isIdle ? 1 : displayProgress}
            timeLabel={isIdle ? "00:00" : formatDuration(sessionTimeRemaining)}
            subtitle={isIdle ? "READY" : currentPhase?.label.toUpperCase() || "DONE"}
            isActive={isSessionActive}
          />
        </View>

        {/* Dynamic Controls Card - FIXED POSITION & SIZE */}
        <GlassCard style={{ width: "100%", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", marginBottom: 120 }}>
          <View className="h-[280px] justify-center px-4 py-[18px]">
            {isIdle ? (
              // SETUP VIEW
              <View className="w-full items-center">
                <ModeSelector mode={localMode} onChange={setLocalMode} />
                
                <View className="my-0.5 h-40 w-full justify-center">
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
                    <View className="w-full">
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
            ) : isDone ? (
              // DONE VIEW
              <View className="w-full items-center">
                <Text className="text-2xl font-black tracking-[-0.5px]" style={{ color: COLORS.accentYellow }}>
                  GREAT SESSION!
                </Text>
                <Text className="mb-5 mt-1.5 text-center text-[13px] leading-[18px] text-white/50">
                  You safely completed your {currentSessionMode} session.
                </Text>
                <TouchableOpacity className="flex-row items-center rounded-2xl bg-accentYellow px-6 py-3" onPress={cancelSession}>
                  <RotateCcw size={18} color="#000000" />
                  <Text className="ml-2 text-xs font-black text-black">BACK TO HOME</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // ACTIVE VIEW
              <View className="w-full items-center">
                <View className="w-full flex-row items-center justify-between px-2.5">
                  <TouchableOpacity
                    className="h-[52px] w-[52px] items-center justify-center rounded-full border border-white/10 bg-white/10"
                    onPress={cancelSession}
                  >
                    <X size={20} color="#FFFFFF" />
                  </TouchableOpacity>
 
                  <TouchableOpacity 
                    className="h-20 w-20 items-center justify-center rounded-full bg-accentYellow"
                    style={{
                      shadowColor: COLORS.accentYellow,
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.3,
                      shadowRadius: 10,
                      elevation: 6,
                    }}
                    onPress={isSessionActive ? pauseSession : resumeSession}
                  >
                    {isSessionActive ? <Pause size={28} color="#000000" fill="#000000" /> : <Play size={28} color="#000000" fill="#000000" />}
                  </TouchableOpacity>
 
                  <TouchableOpacity
                    className="h-[52px] w-[52px] items-center justify-center rounded-full border border-white/10 bg-white/10"
                    onPress={nextPhase}
                  >
                    <ChevronRight size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                
                <Text className="mt-[25px] text-[10px] font-black uppercase tracking-[2px] text-white/25">
                  {currentPhase?.label.toUpperCase() || "ACTIVE"}
                </Text>
              </View>
            )}
          </View>
        </GlassCard>
      </View>
    </GradientBackground>
  );
}
