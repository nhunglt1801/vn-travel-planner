import { apiPost } from './client';
import type { SuggestRequest, SuggestResponse } from '../types';

export function fetchSuggestions(req: SuggestRequest): Promise<SuggestResponse> {
  return apiPost<SuggestResponse>('/suggest', req);
}
