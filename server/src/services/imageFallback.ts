import { getWikipediaImage } from './wikipedia.js';
import { searchUnsplashImage } from './unsplash.js';
import type { ImageResponse } from '../types/index.js';

const FALLBACK_IMAGES = [
  '/fallback-images/fallback-1.svg',
  '/fallback-images/fallback-2.svg',
  '/fallback-images/fallback-3.svg',
  '/fallback-images/fallback-4.svg',
];

export function hashToIndex(input: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash % mod;
}

let lastFallbackIndex = -1;

export function pickFallbackImage(placeName: string): string {
  let index = hashToIndex(placeName, FALLBACK_IMAGES.length);
  if (index === lastFallbackIndex) {
    index = (index + 1) % FALLBACK_IMAGES.length;
  }
  lastFallbackIndex = index;
  return FALLBACK_IMAGES[index];
}

export async function resolveImage(queries: string[], placeName: string): Promise<ImageResponse> {
  const wiki = await getWikipediaImage(queries[0] ?? '');
  if (wiki) {
    return { url: wiki.url, alt: wiki.alt, source: 'wikipedia' };
  }

  for (const query of queries) {
    const unsplash = await searchUnsplashImage(query);
    if (unsplash) {
      return { url: unsplash.url, alt: unsplash.alt, source: 'unsplash' };
    }
  }

  return { url: pickFallbackImage(placeName), alt: placeName, source: 'fallback' };
}
