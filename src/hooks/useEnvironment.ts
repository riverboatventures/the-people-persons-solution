import { useEffect, useState } from 'react';

const WEATHER_CODES: Record<number, string> = {
  0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Fog',
  51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle', 61: 'Rain', 63: 'Rain', 65: 'Heavy Rain',
  71: 'Snow', 73: 'Snow', 75: 'Heavy Snow', 80: 'Showers', 81: 'Showers', 82: 'Storms', 95: 'Thunderstorm',
};

/** Location from the system timezone, network from the browser, and weather from Open-Meteo when coordinates are configured. */
export function useEnvironment() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'Local';
  const location = import.meta.env.VITE_LOCATION_NAME || tz.split('/').pop()!.replace(/_/g, ' ');
  const [online, setOnline] = useState(navigator.onLine);
  const [weather, setWeather] = useState<string | null>(null);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    const lat = import.meta.env.VITE_WEATHER_LAT;
    const lon = import.meta.env.VITE_WEATHER_LON;
    if (!lat || !lon) return;
    const unit = import.meta.env.VITE_WEATHER_UNIT === 'fahrenheit' ? 'fahrenheit' : 'celsius';
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=${unit}`)
      .then((r) => r.json())
      .then((d) => {
        const temp = Math.round(d.current.temperature_2m);
        setWeather(`${temp}°${unit === 'celsius' ? 'C' : 'F'} ${WEATHER_CODES[d.current.weather_code] ?? ''}`.trim());
      })
      .catch(() => setWeather(null));
  }, []);

  const conn = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
  const network = !online ? 'Offline' : !conn?.effectiveType || conn.effectiveType === '4g' ? 'Excellent' : conn.effectiveType.toUpperCase();

  return { location, weather, network, online };
}
