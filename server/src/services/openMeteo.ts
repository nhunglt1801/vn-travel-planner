interface GeocodeResult {
  lat: number;
  lon: number;
  resolvedName: string;
}

async function geocodeQuery(query: string): Promise<GeocodeResult | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=vi&countryCode=VN`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  const result = data?.results?.[0];
  if (!result) return null;
  return { lat: result.latitude, lon: result.longitude, resolvedName: result.name };
}

// Open-Meteo's geocoding gazetteer indexes Vietnamese place names without diacritics
// internally — searching with full diacritics (e.g. "Quảng Ninh", "Hạ Long") reliably
// returns zero results, while the diacritic-stripped form ("Quang Ninh", "Ha Long")
// matches correctly. Confirmed by direct comparison against the live API before fixing.
export function stripDiacritics(text: string): string {
  return text
    .replace(/đ/gi, 'd')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

// Open-Meteo's gazetteer indexes settlements/features by their base name, not by a
// descriptive phrase — "Vịnh Hạ Long" ("the bay at Hạ Long") matches nothing, but the
// underlying place "Hạ Long" does. The AI is explicitly instructed to use official,
// verbatim place names (which legitimately include phrases like "Vịnh Hạ Long" or "Bãi
// biển Mỹ Khê"), so this strips the leading generic descriptor before geocoding only —
// display names elsewhere are untouched. Word-only, leading-position match, so compound
// proper nouns where the descriptor isn't a prefix (e.g. "Côn Đảo") are left intact.
const GEO_DESCRIPTOR_PREFIXES = ['bai bien', 'vinh', 'bai', 'nui', 'ho', 'song', 'thac'];

export function stripGeoDescriptorPrefix(place: string): string {
  const trimmed = place.trim();
  const asciiLower = stripDiacritics(trimmed);
  for (const prefix of GEO_DESCRIPTOR_PREFIXES) {
    if (asciiLower.startsWith(`${prefix} `)) {
      return trimmed.slice(prefix.length).trim();
    }
  }
  return trimmed;
}

// Open-Meteo's geocoding search doesn't recognize the "TP." (Thành phố) abbreviation
// Vietnamese place names commonly use for centrally-governed cities — e.g. "TP. Hồ Chí
// Minh" matches nothing, but "Hồ Chí Minh" or the unabbreviated "Thành phố Hồ Chí Minh"
// does. Strip it so region-based queries actually match.
export function normalizeRegionForGeocode(region: string): string {
  return region.replace(/^t\.?\s?p\.?\s+/i, '').trim();
}

export async function geocode(place: string, region?: string): Promise<GeocodeResult | null> {
  const geoPlace = stripGeoDescriptorPrefix(place);
  const normalizedRegion = region ? normalizeRegionForGeocode(region) : region;
  const query = [geoPlace, normalizedRegion].filter(Boolean).join(', ');
  if (!query) return null;
  try {
    const combined = await geocodeQuery(query);
    if (combined) return combined;

    const asciiQuery = stripDiacritics(query);
    const combinedAscii = await geocodeQuery(asciiQuery);
    if (combinedAscii) return combinedAscii;

    // Fallback 1: region name may be stale (e.g. post-merger province rename) or the
    // combined string doesn't match — retry with place alone.
    const placeOnly = await geocodeQuery(stripDiacritics(geoPlace));
    if (placeOnly) return placeOnly;

    if (!normalizedRegion) return null;

    // Fallback 2: place may be a landmark/POI (a market, a temple, a specific street)
    // that Open-Meteo's gazetteer has no entry for at all, under any phrasing — city-level
    // weather from the region is still far more useful than no forecast.
    return await geocodeQuery(stripDiacritics(normalizedRegion));
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
