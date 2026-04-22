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
  uvIndex: number
): SessionPhase[] {
  const phases: SessionPhase[] = [];
  
  // 1. Initial Protection
  phases.push({ label: "APPLY SUNSCREEN", duration: 120, type: "sunscreen" });

  // 2. Determine Rotation Timing (Scientific Matrix)
  let rotationTime = 1800; // Default 30m
  const subType = fitzpatrickLevel <= 2 ? "sensitive" : fitzpatrickLevel >= 5 ? "resistant" : "normal";

  if (subType === "sensitive") {
    rotationTime = uvIndex > 8 ? 600 : 900; // 10m or 15m
  } else if (subType === "normal") {
    rotationTime = uvIndex > 8 ? 1200 : 1800; // 20m or 30m
  } else {
    rotationTime = uvIndex > 8 ? 1800 : 2700; // 30m or 45m
  }

  // 3. Generate Cycles
  let timeAllocated = 0;
  let cycleCount = 0;
  let side: "front" | "back" = "front";
  let lastHydration = 0;

  while (timeAllocated < totalSeconds) {
    const remainingInSession = totalSeconds - timeAllocated;
    const phaseDuration = Math.min(rotationTime, remainingInSession);

    // Add Exposure Phase
    phases.push({ 
      label: `${side.toUpperCase()} SIDE ${Math.floor(cycleCount / 2) + 1}`, 
      duration: phaseDuration, 
      type: side 
    });

    timeAllocated += phaseDuration;
    lastHydration += phaseDuration;

    // Check for Hydration (every ~30 mins)
    if (lastHydration >= 1800 && timeAllocated < totalSeconds) {
      phases.push({ label: "DRINK WATER", duration: 60, type: "hydration" });
      lastHydration = 0;
    }

    // Add Flip/Transition (if not the end)
    if (timeAllocated < totalSeconds) {
      phases.push({ label: "TIME TO FLIP", duration: 60, type: "flip" });
      
      // Add Cool-down for sensitive skin after each full rotation
      if (subType === "sensitive" && side === "back") {
        phases.push({ label: "SEEK SHADE", duration: 180, type: "cooldown" });
      }
      
      side = side === "front" ? "back" : "front";
      cycleCount++;
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
  cachedCurrentUv: 5,
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

      setWeatherData: ({ currentUv, hourlyUvData, locationName }) =>
        set((state) => ({
          cachedCurrentUv: currentUv,
          hourlyUvData,
          locationName: locationName ?? state.locationName,
          lastWeatherFetch: Date.now(),
        })),

      // ── Session Actions Implementation ──────────────────────────────────────
      startSession: (mode, totalSeconds) =>
        set((state) => {
          const phases = generatePhases(
            totalSeconds, 
            state.fitzpatrickLevel || 3, 
            state.cachedCurrentUv
          );
          return {
            sessionStatus: "active",
            sessionPhases: phases,
            currentPhaseIndex: 0,
            sessionTimeTotal: totalSeconds,
            sessionTimeRemaining: phases[0].duration,
            isSessionActive: true,
            currentSessionMode: mode,
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

      resetProfile: () => set({ ...DEFAULT_STATE, hasCompletedOnboarding: false }),
    }),
    {
      name: "suntanapp-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
