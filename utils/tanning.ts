import { getSkinMultiplier } from "./skin";

/**
 * Centralized formula for Safe Window and Coach Base Time
 * ULTRA-CONSERVATIVE VERSION for medical safety and App Store compliance.
 */
export const calculateSafeMinutes = (
  uv: number, 
  skinLevel: number, 
  spf: number = 0, 
  intensity: "gentle" | "balanced" | "strong" = "balanced"
): number => {
  if (uv <= 0) return 0;
  
  const skinMultiplier = getSkinMultiplier(skinLevel || 2);
  const uvIndex = Math.max(uv, 1.0); // Minimum UV index of 1 for calculations
  
  // 1. Base calculation: (Constant 95 * skinMultiplier) / UV
  // Calibrated to ensure Skin 2 at UV11 stays within 5-8 minutes.
  let minutes = (95 * skinMultiplier) / uvIndex;

  // 2. Apply Intensity Factor
  const intensityFactors = {
    gentle: 0.8,     // Shorter, extra safe
    balanced: 1.0,   // Standard
    strong: 1.2      // Maximum allowed focus on tanning
  };
  minutes *= intensityFactors[intensity];

  // 3. Apply SPF Multipliers (Conservative scaling)
  const creamMultipliers: Record<number, number> = {
    0: 1,
    15: 1.1,
    30: 1.25,
    50: 1.4,
  };
  minutes *= (creamMultipliers[spf] || 1);

  // 4. Final Safety Caps (Non-negotiable hard limits)
  // Even with dark skin and high SPF, we never suggest more than 30/45 min.
  const maxCap = uvIndex >= 9 ? 30 : 45;
  minutes = Math.min(minutes, maxCap);
  
  return Math.round(minutes);
};
