/**
 * useAppStore — Global persistent state (Zustand + AsyncStorage)
 *
 * Persisted across app launches via AsyncStorage.
 * All skin profile data and session preferences live here.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  imageUri?: string;
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
  setLastEngineMode: (mode: EngineMode) => void;
  setWeatherData: (params: {
    currentUv: number;
    currentTemp: number;
    feelsLikeTemp: number;
    hourlyUvData: number[];
    locationName?: string;
  }) => void;

  // ── Session Actions ───────────────────────────────────────────────────────
  startSession: (mode: EngineMode, totalSeconds: number) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  cancelSession: () => void;
  nextPhase: () => void;
  tick: () => void;
  addSessionToHistory: (session: Omit<SessionHistoryItem, "id" | "date">) => void;

  resetProfile: () => void;
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
  mode: EngineMode
): SessionPhase[] {
  const phases: SessionPhase[] = [];
  
  // 1. Initial Protection (Shortened for short personal sessions)
  const sunscreenTime = (mode === "personal" && totalSeconds < 600) ? 60 : 120;
  phases.push({ label: "APPLY SUNSCREEN", duration: sunscreenTime, type: "sunscreen" });

  let exposureSeconds = totalSeconds - sunscreenTime;
  if (exposureSeconds <= 0) exposureSeconds = totalSeconds; // Fallback

  // 2. Personal Mode - Simple Equal Split
  if (mode === "personal") {
    if (exposureSeconds > 300) { // More than 5 mins exposure
      const half = Math.floor(exposureSeconds / 2);
      phases.push({ label: "FRONT SIDE", duration: half, type: "front" });
      phases.push({ label: "FLIP POSITION", duration: 30, type: "flip" });
      phases.push({ label: "BACK SIDE", duration: half - 30, type: "back" });
    } else {
      phases.push({ label: "QUICK EXPOSURE", duration: exposureSeconds, type: "front" });
    }
    return phases;
  }

  // 3. Coach Mode - Scientific Rotation Timing
  let rotationTime = 1800; // Default 30m
  const subType = fitzpatrickLevel <= 2 ? "sensitive" : fitzpatrickLevel >= 5 ? "resistant" : "normal";

  if (subType === "sensitive") {
    rotationTime = uvIndex > 8 ? 600 : 900; // 10m or 15m
  } else if (subType === "normal") {
    rotationTime = uvIndex > 8 ? 1200 : 1800; // 20m or 30m
  } else {
    rotationTime = uvIndex > 8 ? 1800 : 2700; // 30m or 45m
  }

  // Generate Cycles
  let timeAllocated = 0;
  let cycleCount = 0;
  let side: "front" | "back" = "front";
  let lastHydration = 0;

  // If total time is less than rotation time but enough to split, force a split
  if (exposureSeconds < rotationTime && exposureSeconds > 600) {
    rotationTime = Math.floor(exposureSeconds / 2);
  }

  while (timeAllocated < exposureSeconds) {
    const remainingInSession = exposureSeconds - timeAllocated;
    const phaseDuration = Math.min(rotationTime, remainingInSession);

    // Add Exposure Phase
    phases.push({ 
      label: `${side.toUpperCase()} SIDE ${Math.floor(cycleCount / 2) + 1}`, 
      duration: phaseDuration, 
      type: side 
    });

    timeAllocated += phaseDuration;
    lastHydration += phaseDuration;

    // Flip side for next round
    if (timeAllocated < exposureSeconds) {
      if (side === "front") {
        phases.push({ label: "FLIP POSITION", duration: 30, type: "flip" });
        timeAllocated += 30;
      }
      side = side === "front" ? "back" : "front";
      cycleCount++;
    }

    // Check for Hydration (every ~30 mins)
    if (lastHydration >= 1800 && timeAllocated < exposureSeconds) {
      phases.push({ label: "DRINK WATER", duration: 60, type: "hydration" });
      lastHydration = 0;
      timeAllocated += 60;
    }
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

      setLastEngineMode: (mode) => set({ lastEngineMode: mode }),

      setWeatherData: ({ currentUv, currentTemp, feelsLikeTemp, hourlyUvData, locationName }) =>
        set((state) => ({
          cachedCurrentUv: currentUv,
          currentTemp,
          feelsLikeTemp,
          hourlyUvData,
          locationName: locationName ?? state.locationName,
          lastWeatherFetch: Date.now(),
        })),

      // ── Session Actions Implementation ──────────────────────────────────────
      startSession: (mode, totalSeconds) =>
        set((state) => {
          const phases = generatePhases(totalSeconds, state.fitzpatrickLevel || 1, state.cachedCurrentUv, mode);
          const totalDuration = phases.reduce((acc, p) => acc + p.duration, 0);
          
          return {
            currentSessionMode: mode,
            sessionPhases: phases,
            currentPhaseIndex: 0,
            sessionTimeRemaining: phases[0].duration,
            sessionTimeTotal: totalDuration,
            sessionStatus: "active",
            isSessionActive: true,
          };
        }),

      pauseSession: () => set({ isSessionActive: false, sessionStatus: "paused" }),

      resumeSession: () => set({ isSessionActive: true, sessionStatus: "active" }),

      cancelSession: () => set({ 
        sessionStatus: "idle", 
        isSessionActive: false, 
        sessionTimeRemaining: 0,
        currentPhaseIndex: 0,
        sessionPhases: [],
        currentSessionMode: null,
      }),

      nextPhase: () =>
        set((state) => {
          const nextIndex = state.currentPhaseIndex + 1;
          if (nextIndex < state.sessionPhases.length) {
            return {
              currentPhaseIndex: nextIndex,
              sessionTimeRemaining: state.sessionPhases[nextIndex].duration,
            };
          } else {
            return {
              sessionStatus: "done",
              isSessionActive: false,
              sessionTimeRemaining: 0,
            };
          }
        }),

      tick: () =>
        set((state) => {
          if (!state.isSessionActive || state.sessionStatus === "idle" || state.sessionStatus === "done") {
            return {};
          }

          const newRemaining = state.sessionTimeRemaining - 1;

          if (newRemaining <= 0) {
            const nextIndex = state.currentPhaseIndex + 1;
            if (nextIndex < state.sessionPhases.length) {
              return {
                currentPhaseIndex: nextIndex,
                sessionTimeRemaining: state.sessionPhases[nextIndex].duration,
              };
            } else {
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

      resetProfile: () => set({ ...DEFAULT_STATE, hasCompletedOnboarding: false }),
    }),
    {
      name: "suntanapp-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
