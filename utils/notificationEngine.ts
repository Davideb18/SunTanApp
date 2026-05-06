import * as Location from "expo-location";
import { fetchWeatherData } from "./weather";
import { scheduleDailySunNotification } from "./notifications";
import { useAppStore } from "../store/useAppStore";

export async function refreshGPSNotifications() {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") return;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    // Fetch weather ONLY for real GPS, ignoring mockLocation
    const data = await fetchWeatherData(location.coords.latitude, location.coords.longitude);
    
    // Schedule notifications using this REAL data + weather conditions
    await scheduleDailySunNotification(
      data.hourlyUvData, 
      data.currentTemp, 
      data.currentUv,
      data.cloudCover,
      data.weatherCode
    );
    
    console.log("[NotificationEngine] GPS-locked notifications updated for", data.locationName);
  } catch (error) {
    console.error("[NotificationEngine] Failed to refresh GPS notifications:", error);
  }
}
