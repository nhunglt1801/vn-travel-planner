interface WikiImageResult {
  url: string;
  alt: string;
}

export async function getWikipediaImage(query: string): Promise<WikiImageResult | null> {
  if (!query) return null;
  try {
    const searchUrl = `https://vi.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=1&origin=*`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return null;
    const searchData = (await searchRes.json()) as any;
    const title = searchData?.query?.search?.[0]?.title;
    if (!title) return null;

    const summaryUrl = `https://vi.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const summaryRes = await fetch(summaryUrl);
    if (!summaryRes.ok) return null;
    const summary = (await summaryRes.json()) as any;
    const imageUrl = summary?.originalimage?.source || summary?.thumbnail?.source;
    if (!imageUrl) return null;

    return { url: imageUrl, alt: summary.title || query };
  } catch {
    return null;
  }
}
