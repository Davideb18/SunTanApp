/**
 * useAppStore — Global persistent state (Zustand + AsyncStorage)
 *
 * Persisted across app launches via AsyncStorage.
 * All skin profile data and session preferences live here.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { schedulePhaseEndNotification, cancelPhaseEndNotification, scheduleDailySunNotification, scheduleSafetyAlert } from "../utils/notifications";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EngineMode = "coach" | "personal";
export type PhaseType = "sunscreen" | "front" | "back" | "flip" | "hydration" | "cooldown" | "done";

export interface SessionPhase {
  label: string;
  duration: number; // in seconds
  type: PhaseType;
}

export interface SessionHistoryItem {
  id: string;
  date: string; // ISO string
  totalSeconds: number;
  mode: EngineMode;
  uvIndex: number;
  vitD: number;
  sweatMl: number;
  imageUri?: string | null;
  skinColorHex?: string;
}

export interface AppState {
  // ── Onboarding ────────────────────────────────────────────────────────────
  hasCompletedOnboarding: boolean;

  // ── Skin profile ──────────────────────────────────────────────────────────
  skinHex: string | null;
  fitzpatrickLevel: number | null;
  sunReaction: string | null;
  baseTan: string | null;
  currentSpf: number;

  // ── Premium ───────────────────────────────────────────────────────────────
  hasPremium: boolean;
  appOpenCount: number;
  premiumVisible: boolean;
  ambassadorVisible: boolean;

  // ── Mode & Weather ────────────────────────────────────────────────────────
  lastEngineMode: EngineMode;
  cachedCurrentUv: number;
  currentTemp: number;
  feelsLikeTemp: number;
  hourlyUvData: number[];
  locationName: string | null;
  lastWeatherFetch: number | null;

  // ── Session state ─────────────────────────────────────────────────────────
  sessionStatus: "idle" | "active" | "paused" | "done";
  currentPhaseIndex: number;
  sessionPhases: SessionPhase[];
  sessionTimeRemaining: number;
  sessionTimeTotal: number;
  isSessionActive: boolean;
  currentSessionMode: EngineMode | null;
  history: SessionHistoryItem[];
  dailyGoalMinutes: number;
  language: string;
  units: "metric" | "imperial";
  notificationsEnabled: boolean;
  vitDGoalIU: number;
  lastSafetyAlertDate: string | null;

  // ── Actions ───────────────────────────────────────────────────────────────
  setSkinProfile: (params: {
    skinHex: string;
    fitzpatrickLevel: number;
    sunReaction: string;
    baseTan: string;
    currentSpf: number;
  }) => void;

  completeOnboarding: () => void;
  setCurrentSpf: (spf: number) => void;
  setHasPremium: (value: boolean) => void;
  incrementAppOpenCount: () => void;
  setPremiumVisible: (visible: boolean) => void;
  setAmbassadorVisible: (visible: boolean) => void;
  setLastEngineMode: (mode: EngineMode) => void;
  setWeatherData: (params: {
    currentUv: number;
    currentTemp: number;
    feelsLikeTemp: number;
    hourlyUvData: number[];
    locationName?: string;
  }) => void;

  // ── Session Actions ───────────────────────────────────────────────────────
  startSession: (mode: EngineMode, totalSeconds: number, options?: { cycles?: number }) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  cancelSession: () => void;
  nextPhase: () => void;
  tick: () => void;
  addSessionToHistory: (session: Omit<SessionHistoryItem, "id" | "date">) => void;
  updateHistoryItemData: (id: string, updates: Partial<SessionHistoryItem>) => void;
  setCachedCurrentUv: (uv: number) => void;
  setFitzpatrickLevel: (level: number) => void;
  setSkinHex: (hex: string) => void;
  resetProfile: () => void;
  setDailyGoalMinutes: (minutes: number) => void;
  setLanguage: (lang: string) => void;
  setUnits: (units: "metric" | "imperial") => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setVitDGoalIU: (goal: number) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Scientific Session Generator
 * Generates a sequence of phases based on skin type and UV intensity.
 */
function generatePhases(
  totalSeconds: number, 
  fitzpatrickLevel: number, 
  uvIndex: number,
  mode: EngineMode,
  rotationCount?: number
): SessionPhase[] {
  const phases: SessionPhase[] = [];
  
  // 1. Exposure Seconds (Now uses full duration, no sunscreen overhead)
  let exposureSeconds = totalSeconds;

  // 2. Personal Mode - Simple Equal Split
  if (mode === "personal") {
    if (exposureSeconds > 300) { // More than 5 mins exposure
      const half = Math.floor(exposureSeconds / 2);
      phases.push({ label: "FRONT SIDE", duration: half, type: "front" });
      phases.push({ label: "FLIP POSITION", duration: 10, type: "flip" });
      phases.push({ label: "BACK SIDE", duration: half - 10, type: "back" });
    } else {
      phases.push({ label: "QUICK EXPOSURE", duration: exposureSeconds, type: "front" });
    }
    return phases;
  }

  // 3. Coach Mode - derived rotation timing
  let safeRotationCount = Math.max(2, Math.min(rotationCount ?? 4, 8));
  let flipDuration = safeRotationCount > 1 ? 10 * (safeRotationCount - 1) : 0;
  let coachExposureSeconds = totalSeconds - flipDuration;

  while (safeRotationCount > 2 && coachExposureSeconds < safeRotationCount * 10) {
    safeRotationCount -= 1;
    flipDuration = safeRotationCount > 1 ? 10 * (safeRotationCount - 1) : 0;
    coachExposureSeconds = totalSeconds - flipDuration;
  }

  coachExposureSeconds = Math.max(coachExposureSeconds, safeRotationCount * 10);
  const baseExposure = Math.floor(coachExposureSeconds / safeRotationCount);
  let remainder = coachExposureSeconds - baseExposure * safeRotationCount;
  let side: "front" | "back" = "front";

  for (let index = 0; index < safeRotationCount; index += 1) {
    const duration = baseExposure + (remainder > 0 ? 1 : 0);
    remainder -= 1;

    phases.push({
      label: `${side.toUpperCase()} SIDE ${index + 1}`,
      duration,
      type: side,
    });

    if (index < safeRotationCount - 1) {
      phases.push({ label: "FLIP POSITION", duration: 10, type: "flip" });
    }

    side = side === "front" ? "back" : "front";
  }

  return phases;
}

// ---------------------------------------------------------------------------
// Default state values
// ---------------------------------------------------------------------------

const DEFAULT_STATE = {
  hasCompletedOnboarding: false,
  skinHex: null,
  fitzpatrickLevel: null,
  sunReaction: null,
  baseTan: null,
  currentSpf: 30,
  hasPremium: false,
  appOpenCount: 0,
  premiumVisible: false,
  ambassadorVisible: false,
  lastEngineMode: "coach" as EngineMode,
  cachedCurrentUv: 0,
  currentTemp: 0,
  feelsLikeTemp: 0,
  hourlyUvData: [] as number[],
  locationName: null as string | null,
  lastWeatherFetch: null as number | null,
  sessionStatus: "idle" as "idle" | "active" | "paused" | "done",
  currentPhaseIndex: 0,
  sessionPhases: [] as SessionPhase[],
  sessionTimeRemaining: 0,
  sessionTimeTotal: 0,
  isSessionActive: false,
  currentSessionMode: null as EngineMode | null,
  history: [] as SessionHistoryItem[],
  dailyGoalMinutes: 40,
  language: "en",
  units: "metric" as "metric" | "imperial",
  notificationsEnabled: true,
  vitDGoalIU: 15000,
  lastSafetyAlertDate: null as string | null,
} as const;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,

      setSkinProfile: ({ skinHex, fitzpatrickLevel, sunReaction, baseTan, currentSpf }) =>
        set({ skinHex, fitzpatrickLevel, sunReaction, baseTan, currentSpf }),

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      setCurrentSpf: (spf) => set({ currentSpf: spf }),

      setHasPremium: (value) => set({ hasPremium: value }),

      incrementAppOpenCount: () => set((state) => ({ appOpenCount: state.appOpenCount + 1 })),
      
      setPremiumVisible: (visible) => set({ premiumVisible: visible }),
      setAmbassadorVisible: (visible) => set({ ambassadorVisible: visible }),

      setLastEngineMode: (mode) => set({ lastEngineMode: mode }),

      setWeatherData: ({ currentUv, currentTemp, feelsLikeTemp, hourlyUvData, locationName }) => {
        set((state) => {
          if (state.notificationsEnabled && hourlyUvData && hourlyUvData.length > 0) {
            scheduleDailySunNotification(hourlyUvData, currentTemp);
          }
          
          let updatedSafetyDate = state.lastSafetyAlertDate;
          const today = new Date().toDateString();
          if (state.notificationsEnabled && today !== state.lastSafetyAlertDate) {
            if (currentUv >= 9 || currentTemp >= 35) {
              scheduleSafetyAlert(currentUv, currentTemp);
              updatedSafetyDate = today;
            }
          }

          return {
            cachedCurrentUv: currentUv,
            currentTemp,
            feelsLikeTemp,
            hourlyUvData,
            locationName: locationName ?? state.locationName,
            lastWeatherFetch: Date.now(),
            lastSafetyAlertDate: updatedSafetyDate,
          };
        });
      },

      // ── Session Actions Implementation ──────────────────────────────────────
      startSession: (mode, totalSeconds, options) => {
        set((state) => {
          const phases = generatePhases(
            totalSeconds,
            state.fitzpatrickLevel || 1,
            state.cachedCurrentUv,
            mode,
            options?.cycles
          );
          const totalDuration = phases.reduce((acc, p) => acc + p.duration, 0);
          
          if (state.notificationsEnabled) {
             schedulePhaseEndNotification(phases[0].label, phases[0].duration);
          }
          
          return {
            currentSessionMode: mode,
            sessionPhases: phases,
            currentPhaseIndex: 0,
            sessionTimeRemaining: phases[0].duration,
            sessionTimeTotal: totalDuration,
            sessionStatus: "active",
            isSessionActive: true,
          };
        });
      },

      pauseSession: () => {
        cancelPhaseEndNotification();
        set({ isSessionActive: false, sessionStatus: "paused" });
      },

      resumeSession: () => {
        set((state) => {
          if (state.notificationsEnabled) {
            schedulePhaseEndNotification(state.sessionPhases[state.currentPhaseIndex].label, state.sessionTimeRemaining);
          }
          return { isSessionActive: true, sessionStatus: "active" };
        });
      },

      cancelSession: () => {
        cancelPhaseEndNotification();
        set({ 
          sessionStatus: "idle", 
          isSessionActive: false, 
          sessionTimeRemaining: 0,
          currentPhaseIndex: 0,
          sessionPhases: [],
          currentSessionMode: null,
        });
      },

      nextPhase: () => {
        set((state) => {
          const nextIndex = state.currentPhaseIndex + 1;
          if (nextIndex < state.sessionPhases.length) {
            if (state.notificationsEnabled) {
              schedulePhaseEndNotification(state.sessionPhases[nextIndex].label, state.sessionPhases[nextIndex].duration);
            }
            return {
              currentPhaseIndex: nextIndex,
              sessionTimeRemaining: state.sessionPhases[nextIndex].duration,
            };
          } else {
            cancelPhaseEndNotification();
            return {
              sessionStatus: "done",
              isSessionActive: false,
              sessionTimeRemaining: 0,
            };
          }
        });
      },

      tick: () =>
        set((state) => {
          if (!state.isSessionActive || state.sessionStatus === "idle" || state.sessionStatus === "done") {
            return {};
          }

          const newRemaining = state.sessionTimeRemaining - 1;

          if (newRemaining <= 0) {
            const nextIndex = state.currentPhaseIndex + 1;
            if (nextIndex < state.sessionPhases.length) {
              if (state.notificationsEnabled) {
                schedulePhaseEndNotification(state.sessionPhases[nextIndex].label, state.sessionPhases[nextIndex].duration);
              }
              return {
                currentPhaseIndex: nextIndex,
                sessionTimeRemaining: state.sessionPhases[nextIndex].duration,
              };
            } else {
              cancelPhaseEndNotification();
              return {
                sessionStatus: "done",
                isSessionActive: false,
                sessionTimeRemaining: 0,
              };
            }
          }

          return { sessionTimeRemaining: newRemaining };
        }),

      addSessionToHistory: (session) =>
        set((state) => ({
          history: [
            {
              ...session,
              id: Math.random().toString(36).substring(7),
              date: new Date().toISOString(),
            },
            ...state.history,
          ],
        })),

      updateHistoryItemData: (id, updates) =>
        set((state) => ({
          history: state.history.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),

      setCachedCurrentUv: (uv) => set({ cachedCurrentUv: uv }),

      setFitzpatrickLevel: (level) => set({ fitzpatrickLevel: level }),

      setSkinHex: (hex) => set({ skinHex: hex }),

      setDailyGoalMinutes: (minutes) => set({ dailyGoalMinutes: minutes }),
      
      setLanguage: (lang) => set({ language: lang }),
      
      setUnits: (units) => set({ units }),
      
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      
      setVitDGoalIU: (goal) => set({ vitDGoalIU: goal }),

      resetProfile: () => set({ ...DEFAULT_STATE, hasCompletedOnboarding: false }),
    }),
    {
      name: "glowy-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
