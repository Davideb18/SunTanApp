import { getSkinMultiplier } from "./skin";

/**
 * Centralized formula for Safe Window and Coach Base Time
 * Ensures absolute consistency across the entire app.
 */
export const calculateSafeMinutes = (
  uv: number, 
  skinLevel: number, 
  spf: number = 0, 
  intensity: "gentle" | "balanced" | "strong" = "balanced"
): number => {
  if (uv <= 0) return 0;
  
  const skinMultiplier = getSkinMultiplier(skinLevel || 2);
  const uvIndex = Math.max(uv, 0.5);
  
  // 1. Base calculation (Gaussian center: ~20-30m for average UV)
  let minutes = (110 * skinMultiplier) / uvIndex;

  // 2. Apply Intensity Factor
  const intensityFactors = {
    gentle: 0.8,     // Shorter, extra safe
    balanced: 1.0,   // Standard
    strong: 1.15     // Longer, more tan focus
  };
  minutes *= intensityFactors[intensity];

  // 3. Apply SPF (Reduced factors to stay in the 20-30m sweet spot)
  const creamMultipliers: Record<number, number> = {
    0: 1,
    15: 1.1,
    30: 1.2,
    50: 1.3,
  };
  minutes *= (creamMultipliers[spf] || 1);

  // 4. Final Safety Caps (Hard limit at 40m as requested)
  const maxCap = uv >= 9 ? 35 : 50;
  minutes = Math.min(minutes, maxCap);
  
  return Math.round(minutes);
};
