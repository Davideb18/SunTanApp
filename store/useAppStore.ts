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

export interface AppState {
  // ── Onboarding ────────────────────────────────────────────────────────────
  hasCompletedOnboarding: boolean;

  // ── Skin profile ──────────────────────────────────────────────────────────
  /** Hex color of the selected Fitzpatrick swatch */
  skinHex: string | null;
  /** Fitzpatrick phototype level 1–6 */
  fitzpatrickLevel: number | null;
  /** User's self-reported sun reaction id */
  sunReaction: string | null;
  /** User's self-reported base tan id */
  baseTan: string | null;
  /** Currently active SPF value */
  currentSpf: number;

  // ── Premium ───────────────────────────────────────────────────────────────
  hasPremium: boolean;

  // ── Session preferences ───────────────────────────────────────────────────
  /** Last-used engine mode: coach or personal */
  lastEngineMode: EngineMode;
  /** Cached UV index from the weather screen (shared to avoid re-fetches) */
  cachedCurrentUv: number;

  // ── Actions ───────────────────────────────────────────────────────────────
  /** Persist full skin profile collected during onboarding */
  setSkinProfile: (params: {
    skinHex: string;
    fitzpatrickLevel: number;
    sunReaction: string;
    baseTan: string;
    currentSpf: number;
  }) => void;

  /** Mark onboarding as completed — triggers redirect to (tabs) */
  completeOnboarding: () => void;

  /** Update only the SPF without re-running onboarding */
  setCurrentSpf: (spf: number) => void;

  /** Toggle or set premium access */
  setHasPremium: (value: boolean) => void;

  /** Save last-used engine mode so it persists between sessions */
  setLastEngineMode: (mode: EngineMode) => void;

  /** Update the cached UV index from the weather screen */
  setCachedCurrentUv: (uv: number) => void;

  /** Full profile reset — clears all skin data and re-triggers onboarding */
  resetProfile: () => void;
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

      setCachedCurrentUv: (uv) => set({ cachedCurrentUv: uv }),

      resetProfile: () => set({ ...DEFAULT_STATE, hasCompletedOnboarding: false }),
    }),
    {
      name: "suntanapp-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
