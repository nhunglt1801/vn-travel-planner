interface UnsplashImageResult {
  url: string;
  alt: string;
}

export async function searchUnsplashImage(query: string): Promise<UnsplashImageResult | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key || !query) return null;
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1`;
    const res = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } });
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const photo = data?.results?.[0];
    if (!photo) return null;
    return { url: photo.urls.regular, alt: photo.alt_description || query };
  } catch {
    return null;
  }
}
