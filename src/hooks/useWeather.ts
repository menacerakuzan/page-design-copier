import { useQuery } from "@tanstack/react-query";

const OPENWEATHER_KEY = import.meta.env.VITE_OPENWEATHER_KEY;

export type WeatherData = {
  temp: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  cityName: string;
};

export function useWeather(cityName: string | null | undefined) {
  return useQuery<WeatherData | null>({
    queryKey: ["weather", cityName],
    queryFn: async () => {
      if (!OPENWEATHER_KEY || !cityName) return null;
      const cleanName = cityName.replace(/,?\s*UA\s*$/i, "").trim();
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cleanName)},UA&appid=${OPENWEATHER_KEY}&units=metric&lang=uk`,
      );
      if (!res.ok) return null;
      const json = await res.json();
      return {
        temp: Math.round(json.main.temp),
        feelsLike: Math.round(json.main.feels_like),
        description: json.weather[0]?.description ?? "",
        icon: json.weather[0]?.icon ?? "",
        humidity: json.main.humidity,
        windSpeed: Math.round(json.wind.speed),
        cityName: json.name,
      };
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!OPENWEATHER_KEY && !!cityName,
  });
}
