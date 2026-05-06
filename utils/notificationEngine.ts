import * as Location from "expo-location";
import { fetchWeatherData } from "./weather";
import { scheduleDailySunNotification } from "./notifications";
import { useAppStore } from "../store/useAppStore";

export async function refreshGPSNotifications() {
  const store = useAppStore.getState();
  const today = new Date().toDateString();
  
  if (store.lastDailyNotificationDate === today) {
    console.log("[NotificationEngine] Already scheduled today.");
    return;
  }

  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") return;

    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const data = await fetchWeatherData(location.coords.latitude, location.coords.longitude);
    
    await scheduleDailySunNotification(
      data.fullDayUvData, 
      data.currentTemp, 
      data.currentUv,
      data.cloudCover,
      data.weatherCode
    );
    
    store.setLastDailyNotificationDate(today);
    console.log("[NotificationEngine] GPS notifications updated for:", data.locationName);
  } catch (error) {
    console.error("[NotificationEngine] Failed to refresh GPS notifications:", error);
  }
}
