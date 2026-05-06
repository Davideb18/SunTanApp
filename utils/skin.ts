/**
 * Skin Multipliers for Session Duration and Safe Window
 */

export const getSkinMultiplier = (level: number): number => {
  const multipliers: Record<number, number> = {
    1: 0.5,   // Molto chiara
    2: 1.0,   // Chiara (base)
    3: 1.5,   // Media
    4: 2.2,   // Olivastra
    5: 3.5,   // Scura
    6: 5.0,   // Molto scura
  };
  return multipliers[level] || 1.0;
};
