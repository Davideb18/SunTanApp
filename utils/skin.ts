/**
 * Skin Multipliers for Session Duration and Safe Window
 * Calibrated for maximum safety based on medical sunburn thresholds.
 */

export const getSkinMultiplier = (level: number): number => {
  const multipliers: Record<number, number> = {
    1: 0.65,   // Molto chiara - ESTREMA CAUTELA
    2: 0.85,   // Chiara base
    3: 1.05,   // Media
    4: 1.30,   // Olivastra
    5: 1.55,   // Scura
    6: 1.80,   // Molto scura
  };
  return multipliers[level] || 1.0;
};
