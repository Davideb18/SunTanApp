import * as Location from "expo-location";

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
  dailyForecast: ForecastDay[];
}

export async function fetchWeatherData(): Promise<WeatherData> {
  const toHourLabel = (hour: number) => `${String((hour + 24) % 24).padStart(2, "0")}:00`;
  const isRainRisk = (weatherCode: number, precipitationProbability: number) => {
    const wetWeatherCode = weatherCode >= 51 && weatherCode <= 99;
    return wetWeatherCode || precipitationProbability >= 45;
  };

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
  const { latitude, longitude } = location.coords;

  const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
  const city = geocode[0]?.city || geocode[0]?.region || "Your Area";

  // Fetch advanced solar radiation metrics
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,cloud_cover,uv_index,shortwave_radiation,direct_radiation,diffuse_radiation&hourly=uv_index,weather_code,precipitation_probability&daily=uv_index_max,temperature_2m_max,temperature_2m_min,sunrise,sunset,weather_code&timezone=auto&past_days=1&forecast_days=8`;
  
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

  const now = new Date();
  const currentHour = now.getHours();
  const absoluteIndex = 24 + currentHour;
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

    let fallbackDryHour: number | null = null;
    if (peakHourRainRisk) {
      const dryCandidates = nextDayHourlyUv
        .map((uvValue: number, hour: number) => ({
          hour,
          uvValue,
          rainRisk: isRainRisk(nextDayHourlyCodes[hour] ?? 0, nextDayHourlyPrecipitation[hour] ?? 0),
        }))
        .filter((item: { hour: number; uvValue: number; rainRisk: boolean }) => !item.rainRisk && item.uvValue > 0);

      if (dryCandidates.length > 0) {
        dryCandidates.sort((a: { hour: number; uvValue: number }, b: { hour: number; uvValue: number }) => {
          if (b.uvValue !== a.uvValue) return b.uvValue - a.uvValue;
          return Math.abs(a.hour - normalizedPeakHour) - Math.abs(b.hour - normalizedPeakHour);
        });
        fallbackDryHour = dryCandidates[0].hour;
      }
    }

    const chosenHour = fallbackDryHour ?? normalizedPeakHour;
    const strategyRainProbability = nextDayHourlyPrecipitation[chosenHour] ?? 0;
    const strategyStartTime = toHourLabel(chosenHour - 1);
    const strategyEndTime = toHourLabel(chosenHour + 1);
    const bestStartTime = toHourLabel(normalizedPeakHour - 1);
    const bestEndTime = toHourLabel(normalizedPeakHour + 1);
    
    dailyForecast.push({
      date: data.daily.time[i],
      tempMax: data.daily.temperature_2m_max[i] ?? 0,
      uvMax: data.daily.uv_index_max[i] ?? 0,
      weatherCode: data.daily.weather_code[i] ?? 0,
      bestStartTime,
      bestEndTime,
      strategyStartTime,
      strategyEndTime,
      isOptimalWindow: !peakHourRainRisk,
      rainExpected: peakHourRainRisk,
      hasDryFallback: fallbackDryHour !== null,
      peakRainProbability,
      strategyRainProbability,
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
    dailyForecast
  };
}
