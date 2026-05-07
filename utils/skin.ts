/**
 * Skin Multipliers for Session Duration and Safe Window
 */

export const getSkinMultiplier = (level: number): number => {
  const multipliers: Record<number, number> = {
    1: 0.85,   // Molto chiara (ex 0.78)
    2: 1.00,   // Chiara base (ex 0.83)
    3: 1.15,   // Media (ex 0.87)
    4: 1.35,   // Olivastra (ex 0.95)
    5: 1.55,   // Scura (ex 1.05)
    6: 1.70,   // Molto scura (ex 1.15)
  };
  return multipliers[level] || 1.0;
};
