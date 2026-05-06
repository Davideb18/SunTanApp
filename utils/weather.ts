import * as Location from "expo-location";
import { useAppStore } from "@/store/useAppStore";

export interface ForecastDay {
  date: string;
  tempMax: number;
  uvMax: number;
  weatherCode: number;
  bestStartTime: string;
  bestEndTime: string;
  strategyStartTime: string;
  strategyEndTime: string;
  isOptimalWindow: boolean;
  rainExpected: boolean;
  hasDryFallback: boolean;
  peakRainProbability: number;
  strategyRainProbability: number;
  strategyTemp: number;
  strategyWeatherCode: number;
  strategyUv: number;
}

export function getWeatherDescription(code: number, t: any): string {
  if (code === 0) return t.clearSky;
  if (code <= 3) return t.partlyCloudy;
  if (code <= 48) return t.foggy;
  if (code <= 67) return t.drizzle;
  if (code <= 82) return t.rainy;
  if (code <= 99) return t.stormy;
  return t.variable;
}

export interface WeatherData {
  currentUv: number;
  currentTemp: number;
  feelsLikeTemp: number;
  humidity: number;
  cloudCover: number;
  weatherCode: number;
  shortwaveRadiation: number;
  directRadiation: number;
  diffuseRadiation: number;
  sunset: string;
  hourlyUvData: number[];
  locationName: string;
  utcOffset: number;
  dailyForecast: ForecastDay[];
  fullDayUvData: number[];
}

export async function fetchWeatherData(lat?: number, lon?: number): Promise<WeatherData> {
  const toHourLabel = (hour: number) => `${String((hour + 24) % 24).padStart(2, "0")}:00`;
  const isRainRisk = (weatherCode: number, precipitationProbability: number) => {
    const wetWeatherCode = weatherCode >= 51 && weatherCode <= 99;
    return wetWeatherCode || precipitationProbability >= 45;
  };

  const mockLocation = useAppStore.getState().mockLocation;
  let latitude: number;
  let longitude: number;
  let city: string;
  let realLat: number | null = null;
  let realLon: number | null = null;

  // 1. ALWAYS try to get real GPS for notifications (silent)
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === "granted") {
      const realLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      realLat = realLocation.coords.latitude;
      realLon = realLocation.coords.longitude;
    }
  } catch (e) {
    console.log("[Weather] GPS for notifications failed", e);
  }

  if (lat !== undefined && lon !== undefined) {
    latitude = lat;
    longitude = lon;
    city = "Current Area"; // Will be updated by reverse geocode below if needed
  } else if (mockLocation) {
    latitude = mockLocation.lat;
    longitude = mockLocation.lon;
    city = mockLocation.name;
  } else {
    const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
    
    if (status !== "granted") {
      if (canAskAgain) {
        // Show a "normal" text popup before the system one
        await new Promise((resolve) => {
          const { Alert } = require("react-native");
          Alert.alert(
            "Location Required",
            "Glowy needs your location to calculate accurate UV data for your area and protect your skin.",
            [
              { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
              { text: "OK", onPress: () => resolve(true) }
            ]
          );
        });

        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        if (newStatus !== "granted") {
          throw new Error("LOCATION_PERMISSION_DENIED");
        }
      } else {
        throw new Error("LOCATION_PERMISSION_DENIED");
      }
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    latitude = location.coords.latitude;
    longitude = location.coords.longitude;
    realLat = latitude;
    realLon = longitude;

    const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
    city = geocode[0]?.city || geocode[0]?.region || "Your Area";
  }

  // Fetch advanced solar radiation metrics
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,cloud_cover,uv_index,shortwave_radiation,direct_radiation,diffuse_radiation&hourly=uv_index,weather_code,precipitation_probability,temperature_2m&daily=uv_index_max,temperature_2m_max,temperature_2m_min,sunrise,sunset,weather_code&timezone=auto&past_days=1&forecast_days=8`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error("Failed to fetch weather data");
  }
  
  const data = await response.json();

  if (!data.current || !data.hourly || !data.hourly.uv_index || !data.hourly.weather_code || !data.hourly.precipitation_probability) {
    throw new Error("Invalid weather data format");
  }

  const currentUv = data.current.uv_index ?? 0;
  const currentTemp = data.current.temperature_2m ?? 0;
  const feelsLikeTemp = data.current.apparent_temperature ?? 0;
  const humidity = data.current.relative_humidity_2m ?? 0;
  const cloudCover = data.current.cloud_cover ?? 0;
  const weatherCode = data.current.weather_code ?? 0;
  const shortwaveRadiation = data.current.shortwave_radiation ?? 0;
  const directRadiation = data.current.direct_radiation ?? 0;
  const diffuseRadiation = data.current.diffuse_radiation ?? 0;

  // Sanitize hourly data to replace nulls with 0
  const sanitizedHourlyUv = (data.hourly.uv_index || []).map((v: number | null) => v ?? 0);
  const sanitizedHourlyWeatherCode = (data.hourly.weather_code || []).map((v: number | null) => v ?? 0);
  const sanitizedHourlyPrecipitation = (data.hourly.precipitation_probability || []).map((v: number | null) => v ?? 0);

  const utcTime = new Date();
  const utcHours = utcTime.getUTCHours();
  const utcMinutes = utcTime.getUTCMinutes();
  
  // Calculate local hour at the destination
  const offsetSeconds = data.utc_offset_seconds || 0;
  const localHourFractional = (utcHours + utcMinutes / 60 + offsetSeconds / 3600 + 24) % 24;
  const localHour = Math.floor(localHourFractional);
  
  const absoluteIndex = 24 + localHour;
  const centeredData = sanitizedHourlyUv.slice(absoluteIndex - 12, absoluteIndex + 13);
  
  const sunsetFull = data.daily.sunset[1] || "";
  const sunsetTime = sunsetFull.split('T')[1] || "20:00";

  const dailyForecast: ForecastDay[] = [];
  for (let i = 1; i < 9; i++) {
    const nextDayHourlyStart = i * 24;
    const nextDayHourlyUv = sanitizedHourlyUv.slice(nextDayHourlyStart, nextDayHourlyStart + 24);
    const nextDayHourlyCodes = sanitizedHourlyWeatherCode.slice(nextDayHourlyStart, nextDayHourlyStart + 24);
    const nextDayHourlyPrecipitation = sanitizedHourlyPrecipitation.slice(nextDayHourlyStart, nextDayHourlyStart + 24);
    const peakHour = nextDayHourlyUv.indexOf(Math.max(...nextDayHourlyUv));
    const normalizedPeakHour = peakHour >= 0 ? peakHour : 12;

    const peakHourRainRisk = isRainRisk(
      nextDayHourlyCodes[normalizedPeakHour] ?? 0,
      nextDayHourlyPrecipitation[normalizedPeakHour] ?? 0
    );
    const peakRainProbability = nextDayHourlyPrecipitation[normalizedPeakHour] ?? 0;

    const dailyTemps = (data.hourly.temperature_2m || []).slice(nextDayHourlyStart, nextDayHourlyStart + 24);

    // Strategy Selection Logic: Target ~7.5 UV if possible, prefer dry hours.
    const candidates = nextDayHourlyUv.map((uvVal: number, h: number) => ({
      hour: h, uvVal,
      temp: dailyTemps[h] ?? 0,
      code: nextDayHourlyCodes[h] ?? 0,
      isRainy: isRainRisk(nextDayHourlyCodes[h] ?? 0, sanitizedHourlyPrecipitation[h] ?? 0)
    })).filter((c: any) => c.uvVal > 0.5);

    const dryCandidates = candidates.filter((c: any) => !c.isRainy);
    const pool = dryCandidates.length > 0 ? dryCandidates : candidates;
    const dayMax = Math.max(...nextDayHourlyUv);

    const chosen = pool.sort((a: any, b: any) => {
      const target = dayMax > 8.5 ? 7.5 : dayMax;
      return Math.abs(a.uvVal - target) - Math.abs(b.uvVal - target);
    })[0];

    const chosenHour = chosen?.hour ?? normalizedPeakHour;
    const strategyStartTime = toHourLabel(chosenHour - 1);
    const strategyEndTime = toHourLabel(chosenHour + 1);
    
    dailyForecast.push({
      date: data.daily.time[i],
      tempMax: data.daily.temperature_2m_max[i] ?? 0,
      uvMax: data.daily.uv_index_max[i] ?? 0,
      weatherCode: data.daily.weather_code[i] ?? 0,
      bestStartTime: toHourLabel(normalizedPeakHour - 1),
      bestEndTime: toHourLabel(normalizedPeakHour + 1),
      strategyStartTime,
      strategyEndTime,
      isOptimalWindow: !peakHourRainRisk,
      rainExpected: peakHourRainRisk,
      hasDryFallback: false,
      peakRainProbability,
      strategyRainProbability: sanitizedHourlyPrecipitation[chosenHour] ?? 0,
      strategyTemp: dailyTemps[chosenHour] ?? 0,
      strategyWeatherCode: nextDayHourlyCodes[chosenHour] ?? 0,
      strategyUv: nextDayHourlyUv[chosenHour] ?? 0,
    });
  }

  return {
    currentUv,
    currentTemp,
    feelsLikeTemp,
    humidity,
    cloudCover,
    weatherCode,
    shortwaveRadiation,
    directRadiation,
    diffuseRadiation,
    sunset: sunsetTime,
    hourlyUvData: centeredData,
    locationName: city,
    utcOffset: data.utc_offset_seconds || 0,
    dailyForecast,
    fullDayUvData: sanitizedHourlyUv.slice(0, 24)
  };
}
