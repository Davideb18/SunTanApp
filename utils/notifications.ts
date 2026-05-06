import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useAppStore } from '../store/useAppStore';

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

export async function scheduleDailySunNotification(hourlyUvData: number[], currentTemp: number, currentUv: number) {
  const { language } = useAppStore.getState();
  const isIt = language === 'it';
  
  // Clear all previous notifications to ensure clean state
  await Notifications.cancelAllScheduledNotificationsAsync();

  let peakUv = 0;
  let peakHour = -1;
  hourlyUvData.forEach((uv, i) => {
    if (uv > peakUv) {
      peakUv = uv;
      peakHour = i;
    }
  });

  // 1. Morning Notification at 8:30 AM (local phone time)
  const morningHour = 8;
  const morningMinute = 30;

  let morningTitle = isIt ? "Buongiorno! 🌅" : "Good Morning! 🌅";
  let morningBody = "";
  
  const recommended = peakUv >= 3 && peakUv <= 8;
  const hourLabel = peakHour >= 0 ? `${peakHour}:00` : "--:--";

  if (peakUv >= 3) {
    morningBody = isIt
      ? `${recommended ? 'Sì' : 'No'} — ${recommended ? 'Consigliata' : 'Sconsigliata'}: verso le ${hourLabel} (UV: ${Math.round(peakUv)}, Temp: ${Math.round(currentTemp)}°C).`
      : `${recommended ? 'Yes' : 'No'} — ${recommended ? 'Recommended' : 'Not recommended'}: around ${hourLabel} (UV: ${Math.round(peakUv)}, Temp: ${Math.round(currentTemp)}°C).`;
  } else {
    morningBody = isIt ? "Oggi l'indice UV è basso. Goditi la giornata!" : "Low UV today. Enjoy your day!";
  }

  await Notifications.scheduleNotificationAsync({
    content: { title: morningTitle, body: morningBody, sound: true },
    trigger: { 
      type: Notifications.SchedulableTriggerInputTypes.DAILY, 
      hour: morningHour, 
      minute: morningMinute 
    } as any,
  });

  // 2. Safety alert if CURRENT REAL GPS UV is extreme
  if (currentUv > 8) {
    await Notifications.scheduleNotificationAsync({
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

