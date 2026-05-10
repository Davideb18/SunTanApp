// Test runner per calculateSafeMinutes (JS replica)
function getSkinMultiplier(level) {
  const multipliers = {
    1: 0.85,
    2: 1.00,
    3: 1.15,
    4: 1.35,
    5: 1.55,
    6: 1.70,
  };
  return multipliers[level] || 1.0;
}

function calculateSafeMinutes(uv, skinLevel, spf = 0, intensity = 'balanced') {
  if (uv <= 0) return 0;
  const skinMultiplier = getSkinMultiplier(skinLevel || 2);
  const uvIndex = Math.max(uv, 0.5);

  const effectiveSkinFactor = 1 + (skinMultiplier - 1) * 0.5;
  const intensityFactors = { gentle: 0.90, balanced: 1.0, strong: 1.05 };
  const spfFactor = spf > 0 ? 1 + Math.min(spf, 50) / 240 : 1;

  let uvOffset = 2;
  if (uvIndex <= 1) uvOffset = 6;
  else if (uvIndex < 4) uvOffset = 4;
  const uvDenom = uvIndex + uvOffset;

  const base = 170;
  let minutes = (base * effectiveSkinFactor) / uvDenom;
  minutes *= intensityFactors[intensity];
  minutes *= spfFactor;
  // Safety overrides for high-risk combinations
  let overrideCap = Infinity;
  if (spf === 0) {
    if (skinLevel <= 1) {
      if (uvIndex >= 7) overrideCap = Math.min(overrideCap, 10);
      else if (uvIndex >= 4) overrideCap = Math.min(overrideCap, 15);
      else overrideCap = Math.min(overrideCap, 30);
    }
    if (skinLevel === 2) {
      if (uvIndex >= 11) overrideCap = Math.min(overrideCap, 8);
      else if (uvIndex >= 9) overrideCap = Math.min(overrideCap, 12);
      else if (uvIndex >= 7) overrideCap = Math.min(overrideCap, 15);
    }
  }
  if (uvIndex >= 11) overrideCap = Math.min(overrideCap, 20);
  else if (uvIndex >= 9) overrideCap = Math.min(overrideCap, 25);
  if (Number.isFinite(overrideCap)) {
    minutes = Math.min(minutes, overrideCap);
  }
  return Math.round(minutes);
}

const tests = [
  { uv: 11, skin: 3, spf: 30, intensity: 'balanced', label: 'Dubai-like high UV, skin 3, SPF30' },
  { uv: 11, skin: 6, spf: 50, intensity: 'balanced', label: 'UV11, very dark skin, SPF50' },
  { uv: 9, skin: 3, spf: 30, intensity: 'balanced', label: 'UV9, skin3, SPF30' },
  { uv: 9, skin: 6, spf: 30, intensity: 'balanced', label: 'UV9, skin6, SPF30' },
  { uv: 9, skin: 2, spf: 30, intensity: 'balanced', label: 'UV9, skin2, SPF30 (light skin)' },
  { uv: 7, skin: 4, spf: 30, intensity: 'balanced', label: 'UV7, skin4, SPF30' },
  { uv: 7, skin: 1, spf: 0, intensity: 'balanced', label: 'UV7, skin1, no SPF' },
  { uv: 5, skin: 2, spf: 30, intensity: 'balanced', label: 'UV5, skin2, SPF30' },
  { uv: 5, skin: 4, spf: 50, intensity: 'balanced', label: 'UV5, skin4, SPF50' },
  { uv: 3, skin: 1, spf: 0, intensity: 'balanced', label: 'UV3, skin1, no SPF' },
  { uv: 3, skin: 6, spf: 50, intensity: 'balanced', label: 'UV3, skin6, SPF50' },
  { uv: 11, skin: 2, spf: 0, intensity: 'balanced', label: 'UV11, skin2, no SPF (very conservative)' },
  { uv: 9, skin: 5, spf: 15, intensity: 'balanced', label: 'UV9, skin5, SPF15' },
  { uv: 10, skin: 3, spf: 50, intensity: 'balanced', label: 'UV10, skin3, SPF50 (edge case)' },
  { uv: 12, skin: 4, spf: 30, intensity: 'balanced', label: 'UV12, skin4, SPF30 (extreme UV)' },
];

console.log('Running tanning time tests (15 cases)');
console.log('Label | UV | Skin | SPF | Intensity -> Minutes');
for (const t of tests) {
  const m = calculateSafeMinutes(t.uv, t.skin, t.spf, t.intensity);
  console.log(`${t.label} | ${t.uv} | ${t.skin} | ${t.spf} | ${t.intensity} -> ${m} min`);
}
