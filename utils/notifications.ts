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
  const nowHour = now.getHours();
  const centerIndex = Math.floor(hourlyUvData.length / 2);
  // compute actual hour in local time for the peak found in the centered hourlyUvData
  const actualPeakHour = peakHour >= 0 ? ((nowHour - centerIndex + peakHour + 24) % 24) : -1;
  const { language } = useAppStore.getState();
  const isIt = language === 'it';
  
  if (dailyMorningId) await Notifications.cancelScheduledNotificationAsync(dailyMorningId);
  if (dailyPreSessionId) await Notifications.cancelScheduledNotificationAsync(dailyPreSessionId);
  if (sessionStartId) await Notifications.cancelScheduledNotificationAsync(sessionStartId);
  if (safetyAlertId) await Notifications.cancelScheduledNotificationAsync(safetyAlertId);

  // 1. Morning Notification at 8:30 AM (recurring daily)
  const morningHour = 8;
  const morningMinute = 30;

  let morningTitle = isIt ? "Buongiorno! 🌅" : "Good Morning! 🌅";
  let morningBody = isIt
    ? "Oggi l'indice UV è basso. Goditi la giornata!"
    : "Low UV today. Enjoy your day!";

  // Determine recommendation: yes if UV in moderate-high but not extreme
  const recommended = peakUv >= 3 && peakUv <= 8 && actualPeakHour !== -1;
  if (peakUv >= 3 && peakHour !== -1) {
    const hourLabel = actualPeakHour !== -1 ? `${actualPeakHour}:00` : `${peakHour}:00`;
    morningBody = isIt
      ? `${recommended ? 'Sì' : 'No'} — ${recommended ? 'Consigliato' : 'Sconsigliato'}: periodo intorno alle ${hourLabel} (UV: ${Math.round(peakUv)}, Temp: ${Math.round(currentTemp)}°C).`
      : `${recommended ? 'Yes' : 'No'} — ${recommended ? 'Recommended' : 'Not recommended'}: around ${hourLabel} (UV: ${Math.round(peakUv)}, Temp: ${Math.round(currentTemp)}°C).`;
  } else if (peakUv > 8) {
    morningBody = isIt
      ? `Attenzione: UV estremo oggi (${Math.round(peakUv)}). Meglio evitare le ore centrali.`
      : `Caution: Extreme UV today (${Math.round(peakUv)}). Avoid peak hours.`;
  }

  // use calendar trigger with repeats for daily morning notification
  dailyMorningId = await Notifications.scheduleNotificationAsync({
    content: {
      title: morningTitle,
      body: morningBody,
      sound: true,
    },
    trigger: {
      hour: morningHour,
      minute: morningMinute,
      repeats: true,
    } as any,
  });

  // 2. Pre-Session Notification 30 mins before peak UV and session start notification
  if (peakUv >= 3 && peakHour !== -1) {
    // pre-session (30 minutes before)
    let preSessionDate = new Date();
    // use actualPeakHour for scheduling
    preSessionDate.setHours(actualPeakHour, 0, 0, 0);
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

    // session start at peakHour (notify when the interval starts)
    let sessionDate = new Date();
    sessionDate.setHours(actualPeakHour, 0, 0, 0);
    if (now.getTime() < sessionDate.getTime()) {
      sessionStartId = await Notifications.scheduleNotificationAsync({
        content: {
          title: isIt ? "È iniziata la sessione ☀️" : "Session started ☀️",
          body: isIt
            ? `Ora ideale per prendere il sole: ${peakHour}:00 (UV: ${Math.round(peakUv)}).` 
            : `Ideal sun session now: ${peakHour}:00 (UV: ${Math.round(peakUv)}).`,
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: sessionDate },
      });
    }
  }

  // 3. Safety alert if extreme UV
  if (peakUv > 8) {
    safetyAlertId = await Notifications.scheduleNotificationAsync({
      content: {
        title: isIt ? "Attenzione: Alto Rischio di Scottatura! ⚠️" : "High Burn Risk! ⚠️",
        body: isIt
          ? `UV molto alto (${Math.round(peakUv)}). Evita esposizioni prolungate.`
          : `Very high UV (${Math.round(peakUv)}). Avoid prolonged exposure.`,
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

