import * as Location from "expo-location";

export interface WeatherData {
  currentUv: number;
  currentTemp: number;
  feelsLikeTemp: number;
  hourlyUvData: number[];
  locationName: string;
}

export async function fetchWeatherData(): Promise<WeatherData> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Permission to access location was denied");
  }

  const location = await Location.getCurrentPositionAsync({});
  const { latitude, longitude } = location.coords;

  const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
  const city = geocode[0]?.city || geocode[0]?.region || "Your Location";

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=uv_index,temperature_2m,apparent_temperature&current_weather=true&timezone=auto&past_days=1&forecast_days=2`
  );
  
  if (!response.ok) {
    throw new Error("Failed to fetch weather data");
  }
  
  const data = await response.json();

  if (!data.hourly || !data.hourly.uv_index) {
    throw new Error("Invalid weather data format");
  }

  const now = new Date();
  const currentHour = now.getHours();
  const absoluteIndex = 24 + currentHour;
  
  const currentUv = data.hourly.uv_index[absoluteIndex] || 0;
  const currentTemp = data.hourly.temperature_2m[absoluteIndex] || 0;
  const feelsLikeTemp = data.hourly.apparent_temperature[absoluteIndex] || 0;
  
  const centeredData = data.hourly.uv_index.slice(absoluteIndex - 12, absoluteIndex + 13);
  
  return {
    currentUv,
    currentTemp,
    feelsLikeTemp,
    hourlyUvData: centeredData,
    locationName: city,
  };
}
