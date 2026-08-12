import { apiGet } from './client';
import type { ImageResponse } from '../types';

export function fetchImage(query: string, tag: string, place: string): Promise<ImageResponse> {
  return apiGet<ImageResponse>('/image', { query, tag, place });
}
