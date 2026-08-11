export type Budget = 'budget' | 'mid' | 'premium';
export type Companion = 'solo' | 'couple' | 'family' | 'friends';

export interface SuggestRequest {
  prompt: string;
  region?: string;
  days: number;
  startDate: string;
  budget: Budget;
  styles: string[];
  companion: Companion;
}

export interface Place {
  id: string;
  name: string;
  region: string;
  country: string;
  reason: string;
  tags: string[];
  imageQuery: string;
}

export interface SuggestResponse {
  places: Place[];
}

export interface ImageResponse {
  url: string;
  alt: string;
  source: 'wikipedia' | 'unsplash' | 'fallback';
}

export interface WeatherDayAvailable {
  date: string;
  available: true;
  tempMin: number;
  tempMax: number;
  condition: string;
  icon: string;
}

export interface WeatherDayUnavailable {
  date: string;
  available: false;
}

export type WeatherDay = WeatherDayAvailable | WeatherDayUnavailable;

export interface WeatherResponse {
  location: { lat: number; lon: number; resolvedName: string };
  days: WeatherDay[];
}

export interface ItineraryRequest {
  placeName: string;
  region: string;
  country: string;
  days: number;
  startDate: string;
  budget: Budget;
  styles: string[];
  companion: Companion;
}

export interface Slot {
  name: string;
  description: string;
  imageQuery: string;
}

export interface ItineraryDay {
  date: string;
  slots: {
    morning: Slot;
    noon: Slot;
    afternoon: Slot;
    evening: Slot;
  };
}

export interface ItineraryResponse {
  days: ItineraryDay[];
}
