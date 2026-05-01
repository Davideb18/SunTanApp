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
      name: 'SunTanApp',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: '#FFDE00',
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

export async function scheduleDailySunNotification(hourlyUvData: number[], currentTemp: number) {
  let peakUv = 0;
  let peakHour = -1;
  hourlyUvData.forEach((uv, i) => {
    if (uv > peakUv) {
      peakUv = uv;
      peakHour = i;
    }
  });

  const now = new Date();
  const { language } = useAppStore.getState();
  const isIt = language === 'it';
  
  if (dailyMorningId) await Notifications.cancelScheduledNotificationAsync(dailyMorningId);
  if (dailyPreSessionId) await Notifications.cancelScheduledNotificationAsync(dailyPreSessionId);

  // 1. Morning Notification at 8:30 AM
  const morningDate = new Date();
  morningDate.setHours(8, 30, 0, 0);
  if (now.getHours() >= 8 && now.getMinutes() >= 30) {
    morningDate.setDate(morningDate.getDate() + 1);
  }

  let morningTitle = isIt ? "Buongiorno! 🌅" : "Good Morning! 🌅";
  let morningBody = isIt 
    ? "Oggi l'indice UV è basso. Goditi la giornata!" 
    : "Low UV today. Enjoy your day!";
  
  if (peakUv >= 3 && peakHour !== -1) {
    const formatHour = peakHour > 12 ? `${peakHour - 12} PM` : `${peakHour} AM`;
    morningBody = isIt
      ? `Consigliato: sole alle ${peakHour}:00 (UV: ${Math.round(peakUv)}, Temp: ${Math.round(currentTemp)}°C).`
      : `Advice: Sun at ${formatHour} (UV: ${Math.round(peakUv)}, Temp: ${Math.round(currentTemp)}°C).`;
  } else if (peakUv > 8) {
    morningBody = isIt
      ? `Attenzione: UV estremo oggi (${Math.round(peakUv)}). Meglio evitare le ore centrali.`
      : `Caution: Extreme UV today (${Math.round(peakUv)}). Avoid peak hours.`;
  }

  dailyMorningId = await Notifications.scheduleNotificationAsync({
    content: {
      title: morningTitle,
      body: morningBody,
      sound: true,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: morningDate },
  });

  // 2. Pre-Session Notification 30 mins before peak UV
  if (peakUv >= 3 && peakHour !== -1) {
    let preSessionDate = new Date();
    preSessionDate.setHours(peakHour, 0, 0, 0);
    preSessionDate.setMinutes(preSessionDate.getMinutes() - 30);

    if (now.getTime() < preSessionDate.getTime()) {
      dailyPreSessionId = await Notifications.scheduleNotificationAsync({
        content: {
          title: isIt ? "Preparati! 🕶️" : "Get Ready! 🕶️",
          body: isIt 
            ? `Picco UV tra 30 min. Prepara crema e asciugamano!` 
            : "Peak UV in 30 mins. Get your sunscreen and towel!",
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: preSessionDate },
      });
    }
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

