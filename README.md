# ☀️ SunTanApp

> A premium, iOS-style smart tanning tracker built with **Expo SDK 54**, **Expo Router v4**, **NativeWind v4**, and **Zustand**.

---

## Overview

SunTanApp calculates your safe sun-exposure time based on your Fitzpatrick skin phototype and the real-time UV index at your location. A built-in coaching state machine guides you through a full tanning session — reminding you to apply sunscreen, timing each side, and alerting you when it's time to flip.

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | [Expo SDK 54](https://expo.dev) |
| Navigation | [Expo Router v4](https://expo.github.io/router) |
| Styling | [NativeWind v4](https://www.nativewind.dev) (Tailwind CSS v4) |
| State | [Zustand v5](https://zustand-demo.pmnd.rs) + AsyncStorage |
| Gradients | `expo-linear-gradient` |
| Blur | `expo-blur` |
| Icons | `lucide-react-native` |
| Location | `expo-location` |
| Picker | `@react-native-picker/picker` |
| SVG | `react-native-svg` |

---

## Project Structure

```
SunTanApp/
├── app/
│   ├── _layout.tsx          # Root Stack (no ThemeProvider)
│   ├── onboarding.tsx       # 4-step onboarding flow
│   └── (tabs)/
│       ├── _layout.tsx     # Floating dark tab bar + auth guard
│       ├── weather.tsx     # UV Index — Open-Meteo + location
│       ├── index.tsx       # Smart Timer Engine (state machine)
│       └── profile.tsx     # Skin profile + settings
├── components/
│   ├── GradientBackground.tsx
│   ├── GlassCard.tsx
│   ├── UvBar.tsx
│   └── TimerRing.tsx
├── constants/
│   └── theme.ts            # Colors, UV bands, Fitzpatrick types, formulas
└── store/
    └── useAppStore.ts      # Zustand + AsyncStorage persistent store
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm start

# Run on iOS simulator
npm run ios
```

---

## Coach Formula

Safe tanning time is calculated using:

```
safeMinutes = SPF × fitzpatrickLevel × (10 / uvIndex) × 60
```

Clamped between **1 minute** and **4 hours**.

---

## Session State Machine

```
IDLE → SUNSCREEN → FRONT → FLIP → BACK → DONE
```

The timer splits total safe time 50/50 between front and back exposure.

---

## Color Palette

| Token | Hex | Usage |
|---|---|---|
| Gradient Start | `#FFDE00` | Yellow — top-left |
| Gradient Mid | `#fb693d` | Orange — diagonal |
| Gradient End | `#ff0000` | Red — bottom-right |
| Accent Yellow | `#FFDE00` | Active tab, timer glow |
| Tab Bar | `#000000` | Floating tab bar |
