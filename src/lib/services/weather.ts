import { logger } from "../utils/logger";
import type { WeatherInfo, ServiceResult } from "../../types/services";

export async function getWeather(city?: string): Promise<ServiceResult<WeatherInfo>> {
  const targetCity = city || process.env.OPENWEATHER_CITY || "Tokyo";
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return { error: true, code: "WEATHER_NO_API_KEY", message: "OpenWeatherMap API key not configured" };
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(targetCity)}&appid=${apiKey}&units=metric&lang=ja`;
    const res = await fetch(url);

    if (!res.ok) {
      return { error: true, code: "WEATHER_API_ERROR", message: `API returned ${res.status}` };
    }

    const data = await res.json();

    return {
      city: data.name,
      temp: Math.round(data.main.temp),
      temp_max: Math.round(data.main.temp_max),
      temp_min: Math.round(data.main.temp_min),
      description: data.weather?.[0]?.description || "",
      humidity: data.main.humidity,
      icon: data.weather?.[0]?.icon || "",
    };
  } catch (err) {
    logger.error("Weather fetch failed", { city: targetCity, error: String(err) });
    return { error: true, code: "WEATHER_FETCH_FAILED", message: String(err) };
  }
}
