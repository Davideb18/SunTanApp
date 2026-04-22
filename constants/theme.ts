/**
 * Design System — SunTanApp
 *
 * Single source of truth for all color tokens, gradients, and semantic
 * design values used across the application.
 */

// ---------------------------------------------------------------------------
// Gradient palette
// ---------------------------------------------------------------------------
export const GRADIENT_COLORS = ["#FFDE00", "#fb693d", "#ff0000"] as const;

export const GRADIENT_START = { x: 0, y: 0 } as const;
export const GRADIENT_END = { x: 1, y: 1 } as const;

// ---------------------------------------------------------------------------
// Brand colors
// ---------------------------------------------------------------------------
export const COLORS = {
  /** Primary accent — active tabs, highlights, timer glow */
  accentYellow: "#FFDE00",
  /** Secondary accent — current UV bar, mid-gradient */
  accentOrange: "#fb693d",
  /** Danger / high-UV red */
  accentRed: "#ff0000",

  // Glass / overlay
  glassBg: "rgba(0, 0, 0, 0.30)",
  glassBorder: "rgba(255, 255, 255, 0.20)",
  glassHighlight: "rgba(255, 255, 255, 0.08)",

  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255, 255, 255, 0.60)",
  textMuted: "rgba(255, 255, 255, 0.35)",

  // Tab bar
  tabBarBg: "#000000",
  tabBarActive: "#FFDE00",
  tabBarInactive: "rgba(255, 255, 255, 0.40)",

  // Semantic
  success: "#4CAF50",
  warning: "#FFDE00",
  danger: "#ff0000",
} as const;

// ---------------------------------------------------------------------------
// UV index severity scale
// ---------------------------------------------------------------------------
export type UvCategory = "Low" | "Moderate" | "High" | "Very High" | "Extreme";

export interface UvBand {
  label: UvCategory;
  minIndex: number;
  color: string;
  emoji: string;
}

export const UV_BANDS: UvBand[] = [
  { label: "Low",       minIndex: 0,  color: "#FFF59D", emoji: "🟡" },
  { label: "Moderate",  minIndex: 3,  color: "#FDD835", emoji: "☀️" },
  { label: "High",      minIndex: 6,  color: "#FB8C00", emoji: "🟠" },
  { label: "Very High", minIndex: 8,  color: "#E64A19", emoji: "🔴" },
  { label: "Extreme",   minIndex: 11, color: "#B71C1C", emoji: "🟣" },
];

/** Returns the UV band descriptor for a given UV index. */
export function getUvBand(uvIndex: number): UvBand {
  const sorted = [...UV_BANDS].reverse();
  return sorted.find((b) => uvIndex >= b.minIndex) ?? UV_BANDS[0];
}

// ---------------------------------------------------------------------------
// Fitzpatrick skin type palette
// ---------------------------------------------------------------------------
export interface FitzpatrickType {
  level: number;
  label: string;
  description: string;
  hex: string;
  /** Skin sensitivity multiplier used in safe-time formula */
  sensitivityFactor: number;
}

export const FITZPATRICK_TYPES: FitzpatrickType[] = [
  {
    level: 1,
    label: "Very Fair",
    description: "Pale ivory, always burns, never tans",
    hex: "#FDDBB4",
    sensitivityFactor: 1,
  },
  {
    level: 2,
    label: "Fair",
    description: "Fair, usually burns, sometimes tans",
    hex: "#F5C6A0",
    sensitivityFactor: 2,
  },
  {
    level: 3,
    label: "Medium",
    description: "Light brown, sometimes burns, always tans",
    hex: "#E8A97A",
    sensitivityFactor: 3,
  },
  {
    level: 4,
    label: "Olive",
    description: "Moderate brown, rarely burns, tans easily",
    hex: "#C68642",
    sensitivityFactor: 4,
  },
  {
    level: 5,
    label: "Brown",
    description: "Dark brown, very rarely burns",
    hex: "#8D5524",
    sensitivityFactor: 5,
  },
  {
    level: 6,
    label: "Very Dark",
    description: "Deeply pigmented, never burns",
    hex: "#4A2912",
    sensitivityFactor: 6,
  },
];

// ---------------------------------------------------------------------------
// SPF options
// ---------------------------------------------------------------------------
export interface SpfOption {
  value: number;
  label: string;
}

export const SPF_OPTIONS: SpfOption[] = [
  { value: 0,   label: "None"   },
  { value: 15,  label: "15"  },
  { value: 30,  label: "30"  },
  { value: 50,  label: "50"  },
];

// ---------------------------------------------------------------------------
// Sun Reaction options
// ---------------------------------------------------------------------------
export interface ReactionOption {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

export const SUN_REACTION_OPTIONS: ReactionOption[] = [
  { id: "never",     label: "Never Burns",     emoji: "😎", description: "My skin never burns" },
  { id: "sometimes", label: "Sometimes Burns", emoji: "🙂", description: "I burn occasionally"  },
  { id: "often",     label: "Often Burns",     emoji: "😬", description: "I burn more often than not" },
  { id: "always",    label: "Always Burns",    emoji: "🔥", description: "I burn almost always" },
];

// ---------------------------------------------------------------------------
// Base Tan options
// ---------------------------------------------------------------------------
export interface BaseTanOption {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

export const BASE_TAN_OPTIONS: BaseTanOption[] = [
  { id: "none",   label: "No Base Tan",    emoji: "⚪", description: "Starting completely fresh" },
  { id: "light",  label: "Light Base",     emoji: "🌤️", description: "Slightly tanned"          },
  { id: "medium", label: "Medium Base",    emoji: "☀️", description: "Noticeably tanned"         },
  { id: "deep",   label: "Deep Base",      emoji: "🌞", description: "Very deeply tanned"        },
];

// ---------------------------------------------------------------------------
// Safe tanning formula
// ---------------------------------------------------------------------------
/**
 * Calculates safe tanning time in seconds using the Coach formula:
 *   safeMinutes = SPF × fitzpatrickLevel × (10 / uvIndex) × 60
 *
 * Clamped between 60 seconds and 14400 seconds (4 hours).
 */
export function calcSafeSeconds(
  spf: number,
  fitzpatrickLevel: number,
  uvIndex: number
): number {
  if (uvIndex <= 0) return 14400; // UV=0 → no sun risk, return max
  // Safe minutes = SPF × SkinSensitivity × (ReferenceUV / CurrentUV)
  // Using 10 as ReferenceUV for the ratio calculation.
  const minutes = (spf || 1) * fitzpatrickLevel * (10 / uvIndex); 
  const seconds = Math.floor(minutes * 60);
  
  // Clamp between 1 minute and 4 hours
  return Math.max(60, Math.min(seconds, 14400));
}

/** Formats a total number of seconds as "Xh Ym Zs" or "Ym Zs" string. */
export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** Formats seconds as a compact "Xh Ym" label (used in Coach Mode selection). */
export function formatCompact(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}
