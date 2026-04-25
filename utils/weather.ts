import * as Location from "expo-location";

export interface ForecastDay {
  date: string;
  tempMax: number;
  uvMax: number;
  weatherCode: number;
  bestStartTime: string;
  bestEndTime: string;
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
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new Error("LOCATION_PERMISSION_DENIED");
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const { latitude, longitude } = location.coords;

  const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
  const city = geocode[0]?.city || geocode[0]?.region || "La tua zona";

  // Fetch advanced solar radiation metrics
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,cloud_cover,uv_index,shortwave_radiation,direct_radiation,diffuse_radiation&hourly=uv_index&daily=uv_index_max,temperature_2m_max,temperature_2m_min,sunrise,sunset,weather_code&timezone=auto&past_days=1&forecast_days=8`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error("Failed to fetch weather data");
  }
  
  const data = await response.json();

  if (!data.current || !data.hourly || !data.hourly.uv_index) {
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

  const now = new Date();
  const currentHour = now.getHours();
  const absoluteIndex = 24 + currentHour;
  const centeredData = sanitizedHourlyUv.slice(absoluteIndex - 12, absoluteIndex + 13);
  
  const sunsetFull = data.daily.sunset[1] || "";
  const sunsetTime = sunsetFull.split('T')[1] || "20:00";

  const dailyForecast: ForecastDay[] = [];
  for (let i = 2; i < 9; i++) {
    const nextDayHourlyStart = i * 24;
    const nextDayHourlyUv = sanitizedHourlyUv.slice(nextDayHourlyStart, nextDayHourlyStart + 24);
    const peakHour = nextDayHourlyUv.indexOf(Math.max(...nextDayHourlyUv));
    
    dailyForecast.push({
      date: data.daily.time[i],
      tempMax: data.daily.temperature_2m_max[i] ?? 0,
      uvMax: data.daily.uv_index_max[i] ?? 0,
      weatherCode: data.daily.weather_code[i] ?? 0,
      bestStartTime: `${peakHour - 1}:00`,
      bestEndTime: `${peakHour + 1}:00`
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
