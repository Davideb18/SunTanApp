/**
 * Skin Multipliers for Session Duration and Safe Window
 */

export const getSkinMultiplier = (level: number): number => {
  const multipliers: Record<number, number> = {
    1: 0.78,   // Molto chiara
    2: 0.83,   // Chiara (base)
    3: 0.87,   // Media
    4: 0.95,   // Olivastra
    5: 1.05,   // Scura
    6: 1.15,   // Molto scura
  };
  return multipliers[level] || 1.0;
};
