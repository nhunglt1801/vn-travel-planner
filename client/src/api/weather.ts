import { apiGet } from './client';
import type { WeatherResponse } from '../types';

export function fetchWeather(place: string, region: string, dates: string[]): Promise<WeatherResponse> {
  return apiGet<WeatherResponse>('/weather', { place, region, dates: dates.join(',') });
}
