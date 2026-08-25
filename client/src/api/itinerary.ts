import { apiPost } from './client';
import type { ItineraryRequest, ItineraryResponse } from '../types';

export function fetchItinerary(req: ItineraryRequest): Promise<ItineraryResponse> {
  return apiPost<ItineraryResponse>('/itinerary', req);
}
