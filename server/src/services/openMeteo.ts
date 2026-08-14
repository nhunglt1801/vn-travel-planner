interface GeocodeResult {
  lat: number;
  lon: number;
  resolvedName: string;
}

export async function geocode(place: string, region?: string): Promise<GeocodeResult | null> {
  const query = [place, region].filter(Boolean).join(', ');
  if (!query) return null;
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=vi`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const result = data?.results?.[0];
    if (!result) return null;
    return { lat: result.latitude, lon: result.longitude, resolvedName: result.name };
  } catch {
    return null;
  }
}

interface ForecastDay {
  date: string;
  tempMin: number;
  tempMax: number;
  condition: string;
  icon: string;
}

const WEATHER_CODE_MAP: Record<number, { condition: string; icon: string }> = {
  0: { condition: 'Trời quang', icon: '☀️' },
  1: { condition: 'Ít mây', icon: '🌤️' },
  2: { condition: 'Có mây', icon: '⛅' },
  3: { condition: 'Nhiều mây', icon: '☁️' },
  45: { condition: 'Sương mù', icon: '🌫️' },
  48: { condition: 'Sương mù đóng băng', icon: '🌫️' },
  51: { condition: 'Mưa phùn nhẹ', icon: '🌦️' },
  53: { condition: 'Mưa phùn', icon: '🌦️' },
  55: { condition: 'Mưa phùn dày', icon: '🌧️' },
  61: { condition: 'Mưa nhẹ', icon: '🌧️' },
  63: { condition: 'Mưa vừa', icon: '🌧️' },
  65: { condition: 'Mưa to', icon: '⛈️' },
  71: { condition: 'Tuyết nhẹ', icon: '🌨️' },
  80: { condition: 'Mưa rào nhẹ', icon: '🌦️' },
  81: { condition: 'Mưa rào vừa', icon: '🌧️' },
  82: { condition: 'Mưa rào to', icon: '⛈️' },
  95: { condition: 'Dông', icon: '⛈️' },
};

function describeWeatherCode(code: number) {
  return WEATHER_CODE_MAP[code] ?? { condition: 'Không rõ', icon: '🌡️' };
}

export async function getForecast(lat: number, lon: number): Promise<Map<string, ForecastDay>> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&forecast_days=16`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo forecast request failed: ${res.status}`);
  const data = (await res.json()) as any;

  const map = new Map<string, ForecastDay>();
  const dates: string[] = data.daily.time;
  dates.forEach((date: string, i: number) => {
    const { condition, icon } = describeWeatherCode(data.daily.weathercode[i]);
    map.set(date, {
      date,
      tempMin: data.daily.temperature_2m_min[i],
      tempMax: data.daily.temperature_2m_max[i],
      condition,
      icon,
    });
  });
  return map;
}
