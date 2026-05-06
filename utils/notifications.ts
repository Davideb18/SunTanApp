import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { getWeatherDescription } from './weather';

// Set how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function setupNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Glowy',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: '#FACC15',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

let phaseNotificationId: string | null = null;

export async function schedulePhaseEndNotification(phaseLabel: string, durationSeconds: number) {
  await cancelPhaseEndNotification();
  
  const safeDuration = Math.max(1, durationSeconds);
  const { language } = useAppStore.getState();
  const isIt = language === 'it';

  phaseNotificationId = await Notifications.scheduleNotificationAsync({
    identifier: 'phase-end',
    content: {
      title: isIt ? "Fase Completata! ☀️" : "Phase Complete! ☀️",
      body: isIt 
        ? `La tua fase ${phaseLabel === "FRONT SIDE" ? "Davanti" : "Dietro"} è finita. Ruota ora!` 
        : `Your ${phaseLabel} phase is done. Rotate now!`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: { 
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, 
      seconds: safeDuration 
    },
  });
}

export async function cancelPhaseEndNotification() {
  if (phaseNotificationId) {
    await Notifications.cancelScheduledNotificationAsync(phaseNotificationId);
    phaseNotificationId = null;
  }
}

let dailyMorningId: string | null = null;
let dailyPreSessionId: string | null = null;
let sessionStartId: string | null = null;
let safetyAlertId: string | null = null;

export async function scheduleDailySunNotification(hourlyUvData: number[], currentTemp: number, currentUv: number, cloudCover: number = 0, weatherCode: number = 0) {
  const { language } = useAppStore.getState();
  const isIt = language === 'it';
  // Use the raw translation objects instead of the hook
  const { it, en } = require('../constants/i18n');
  const t = isIt ? it : en;
  
  try {
    await Notifications.cancelScheduledNotificationAsync('daily-sun-advice');
  } catch (error) {}

  let peakUv = 0;
  let peakHour = -1;
  hourlyUvData.forEach((uv, i) => {
    if (uv > peakUv) {
      peakUv = uv;
      peakHour = i;
    }
  });

  // If UV is 0 all day, no notification
  if (peakUv < 1) return;

  const morningHour = 8;
  const morningMinute = 30;

  const trigger: any = {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour: morningHour,
    minute: morningMinute,
  };

  const weatherDesc = getWeatherDescription(weatherCode, t);
  const hourLabel = peakHour >= 0 ? `${peakHour}:00` : "--:--";
  
  let morningTitle = isIt ? "Il sole di oggi ☀️" : "Today's Sun ☀️";
  const morningBody = isIt
    ? `Picco UV ${Math.round(peakUv)} alle ${hourLabel} (${Math.round(currentTemp)}°C). Meteo: ${weatherDesc}.`
    : `UV Peak ${Math.round(peakUv)} at ${hourLabel} (${Math.round(currentTemp)}°C). Weather: ${weatherDesc}.`;

  await Notifications.scheduleNotificationAsync({
    identifier: 'daily-sun-advice',
    content: { title: morningTitle, body: morningBody, sound: true },
    trigger,
  });

  // 2. Pre-session Notification (30 mins before peak hour)
  const now = new Date();
  const alertTime = new Date();
  alertTime.setHours(peakHour, 0, 0, 0);
  alertTime.setMinutes(alertTime.getMinutes() - 30); // 30 mins before

  if (alertTime.getTime() > now.getTime()) {
    try {
      await Notifications.cancelScheduledNotificationAsync('pre-session-alert');
    } catch (e) {}
    
    await Notifications.scheduleNotificationAsync({
      identifier: 'pre-session-alert',
      content: {
        title: isIt ? "Il sole è quasi pronto! ☀️" : "Sun is almost ready! ☀️",
        body: isIt
          ? `Tra 30 minuti inizia il picco UV. Preparati per la tua sessione!`
          : `UV peak starts in 30 minutes. Get ready for your session!`,
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: alertTime },
    });
  }

  // 2. Safety alert if CURRENT REAL GPS UV is extreme
  if (currentUv > 8) {
    await Notifications.scheduleNotificationAsync({
      identifier: 'uv-burn-risk',
      content: {
        title: isIt ? "Attenzione: Alto Rischio di Scottatura! ⚠️" : "High Burn Risk! ⚠️",
        body: isIt
          ? `UV molto alto (${Math.round(currentUv)}). Evita esposizioni prolungate.`
          : `Very high UV (${Math.round(currentUv)}). Avoid prolonged exposure.`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1 },
    });
  }
}

export async function scheduleSafetyAlert(uvIndex: number, currentTemp: number) {
  const { language } = useAppStore.getState();
  const isIt = language === 'it';

  await Notifications.scheduleNotificationAsync({
    identifier: 'safety-alert',
    content: {
      title: isIt ? "Allerta Meteo Estrema! ⚠️" : "Extreme Weather Alert! ⚠️",
      body: isIt
        ? `Condizioni estreme! UV: ${uvIndex}, Temp: ${currentTemp}°C. Evita l'esposizione prolungata.`
        : `Extreme conditions! UV: ${uvIndex}, Temp: ${currentTemp}°C. Avoid prolonged exposure.`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1 },
  });
}

// Calculate current streak (consecutive days with sessions)
export function calculateCurrentStreak(): number {
  const { history } = useAppStore.getState();
  if (!history || history.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  let checkDate = new Date(today);

  // Walk backwards from today
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const hasSession = history.some(s => s.date.startsWith(dateStr));
    
    if (hasSession) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

let streakWarningId: string | null = null;

export async function scheduleStreakWarningNotification() {
  await cancelStreakWarningNotification();

  const streak = calculateCurrentStreak();
  const { language } = useAppStore.getState();
  const isIt = language === 'it';

  // Only notify if streak >= 4 AND is a multiple of 4
  if (streak < 4 || streak % 4 !== 0) {
    return;
  }

  // Calculate when the streak expires (23 hours from now, or more precisely:
  // 24 hours after the last session of yesterday)
  const now = new Date();
  const lastSessionDate = new Date(now);
  lastSessionDate.setDate(lastSessionDate.getDate() - 1); // Yesterday
  lastSessionDate.setHours(23, 59, 59, 0); // End of yesterday

  // Warn 1 hour before the streak expires
  const warningTime = new Date(lastSessionDate);
  warningTime.setHours(warningTime.getHours() + 1); // 1 hour after streak expires = now + ~24 - 1 = ~23 hours from now

  if (now.getTime() < warningTime.getTime()) {
    streakWarningId = await Notifications.scheduleNotificationAsync({
      identifier: 'streak-warning',
      content: {
        title: isIt ? "🔥 Streack in Pericolo!" : "🔥 Streak at Risk!",
        body: isIt
          ? `Tra 1 ora perderai la streak di ${streak} giorni di fila! Fai una sessione adesso.`
          : `You'll lose your ${streak}-day streak in 1 hour! Get a session in now.`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: warningTime },
    });
  }
}

export async function cancelStreakWarningNotification() {
  if (streakWarningId !== null) {
    await Notifications.cancelScheduledNotificationAsync(streakWarningId);
    streakWarningId = null;
  }
}

