import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
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
    let interval: NodeJS.Timeout | null = null;
    
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
        style={[
          styles.container, 
          { 
            paddingTop: insets.top + 15, 
            paddingBottom: insets.bottom + 5 
          }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Smart Tracker</Text>
          <View style={styles.subtitleRow}>
            <ShieldCheck size={12} color={COLORS.accentOrange} style={{ marginRight: 6 }} />
            <Text style={styles.subtitle}>
              {isIdle ? "SAFETY-GATED ENGINE" : `PHASE ${currentPhaseIndex + 1} OF ${totalPhases}`}
            </Text>
          </View>
        </View>

        {/* Center Section: Ring (STATIONARY) */}
        <View style={styles.ringWrapper}>
          <TimerRing
            size={250}
            progress={isIdle ? 1 : displayProgress}
            timeLabel={isIdle ? "00:00" : formatDuration(sessionTimeRemaining)}
            subtitle={isIdle ? "READY" : currentPhase?.label.toUpperCase() || "DONE"}
            isActive={isSessionActive}
          />
        </View>

        {/* Dynamic Controls Card - FIXED POSITION & SIZE */}
        <GlassCard style={styles.controlsCard}>
          <View style={styles.cardContentFixed}>
            {isIdle ? (
              // SETUP VIEW
              <View style={styles.setupContainer}>
                <ModeSelector mode={localMode} onChange={setLocalMode} />
                
                <View style={styles.setupActionArea}>
                  {localMode === "coach" ? (
                    <View style={styles.coachPreview}>
                      <View style={styles.modeIndicator}>
                         <UserCircle size={14} color="rgba(255,255,255,0.4)" />
                         <Text style={styles.previewTitle}>COACH PREVIEW</Text>
                      </View>
                      <Text style={styles.previewValue}>
                        {formatDuration(calcSafeSeconds(currentSpf, fitzpatrickLevel || 1, cachedCurrentUv))}
                      </Text>
                      <View style={styles.infoBadge}>
                        <Text style={styles.previewDesc}>Safe UV {cachedCurrentUv} • SPF {currentSpf}</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.manualWrapper}>
                      <ManualTimePicker value={personalMinutes} onChange={setPersonalMinutes} />
                    </View>
                  )}
                </View>

                <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.8}>
                   <Play size={20} color="#000000" fill="#000000" />
                   <Text style={styles.startBtnText}>START SESSION</Text>
                </TouchableOpacity>
              </View>
            ) : isDone ? (
              // DONE VIEW
              <View style={styles.doneContainer}>
                <Text style={styles.doneTitle}>GREAT SESSION!</Text>
                <Text style={styles.doneDesc}>You safely completed your {currentSessionMode} session.</Text>
                <TouchableOpacity style={styles.resetBtn} onPress={cancelSession}>
                  <RotateCcw size={18} color="#000000" />
                  <Text style={styles.resetBtnText}>BACK TO HOME</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // ACTIVE VIEW
              <View style={styles.activeControls}>
                <View style={styles.mainControlsRow}>
                  <TouchableOpacity style={styles.iconBtn} onPress={cancelSession}>
                    <X size={20} color="#FFFFFF" />
                  </TouchableOpacity>
 
                  <TouchableOpacity 
                    style={styles.playPauseBtn} 
                    onPress={isSessionActive ? pauseSession : resumeSession}
                  >
                    {isSessionActive ? <Pause size={28} color="#000000" fill="#000000" /> : <Play size={28} color="#000000" fill="#000000" />}
                  </TouchableOpacity>
 
                  <TouchableOpacity style={styles.iconBtn} onPress={nextPhase}>
                    <ChevronRight size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.sessionModeLabel}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  header: {
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    color: COLORS.accentOrange,
    textTransform: "uppercase",
  },
  ringWrapper: {
    marginTop: 10,
    marginBottom: 20,
  },
  controlsCard: {
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 120,
  },
  cardContentFixed: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    height: 280,
    justifyContent: "center",
  },
  setupContainer: {
    alignItems: "center",
    width: "100%",
  },
  setupActionArea: {
    height: 160,
    width: "100%",
    justifyContent: "center",
    marginVertical: 2,
  },
  coachPreview: {
    alignItems: "center",
    width: "100%",
  },
  modeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  previewTitle: {
    fontSize: 9,
    fontWeight: "900",
    color: "rgba(255,255,255,0.3)",
    letterSpacing: 1.5,
    marginLeft: 6,
  },
  previewValue: {
    fontSize: 48,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -2,
    marginVertical: 2,
  },
  infoBadge: {
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 4,
  },
  previewDesc: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
  },
  manualWrapper: {
    width: "100%",
  },
  startBtn: {
    flexDirection: "row",
    backgroundColor: COLORS.accentYellow,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 2,
    shadowColor: COLORS.accentYellow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startBtnText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#000000",
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  activeControls: {
    alignItems: "center",
    width: "100%",
  },
  mainControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
  },
  playPauseBtn: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.accentYellow,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.accentYellow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  iconBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  sessionModeLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "rgba(255,255,255,0.25)",
    letterSpacing: 2,
    marginTop: 25,
    textTransform: "uppercase",
  },
  doneContainer: {
    alignItems: "center",
    width: "100%",
  },
  doneTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.accentYellow,
    letterSpacing: -0.5,
  },
  doneDesc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 20,
  },
  resetBtn: {
    flexDirection: "row",
    backgroundColor: COLORS.accentYellow,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#000000",
    marginLeft: 8,
  },
});
