interface WikiImageResult {
  url: string;
  alt: string;
}

const GENERIC_WORDS = new Set([
  'beach', 'beaches', 'island', 'islands', 'bay', 'national', 'park',
  'city', 'town', 'province', 'district', 'the', 'of', 'in', 'at', 'and',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function stripGenericWords(query: string): string {
  return tokenize(query)
    .filter((token) => !GENERIC_WORDS.has(token))
    .join(' ');
}

export function isRelevantMatch(cleanedQuery: string, title: string): boolean {
  const queryTokens = tokenize(cleanedQuery);
  if (queryTokens.length === 0) return false;
  const titleTokens = new Set(tokenize(title));
  return queryTokens.every((token) => titleTokens.has(token));
}

async function findEnglishTitle(cleanedQuery: string): Promise<string | null> {
  const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(cleanedQuery)}&format=json&limit=3`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  const titles: string[] = data?.[1] ?? [];
  for (const title of titles) {
    if (isRelevantMatch(cleanedQuery, title)) return title;
  }
  return null;
}

async function getVietnameseTitle(englishTitle: string): Promise<string | null> {
  const propsUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(englishTitle)}&prop=pageprops&redirects=1&format=json`;
  const propsRes = await fetch(propsUrl);
  if (!propsRes.ok) return null;
  const propsData = (await propsRes.json()) as any;
  const pages = propsData?.query?.pages;
  if (!pages) return null;
  const page = Object.values(pages)[0] as any;
  const qid = page?.pageprops?.wikibase_item;
  if (!qid) return null;

  const sitelinksUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&props=sitelinks&sitefilter=viwiki&format=json`;
  const sitelinksRes = await fetch(sitelinksUrl);
  if (!sitelinksRes.ok) return null;
  const sitelinksData = (await sitelinksRes.json()) as any;
  const viTitle = sitelinksData?.entities?.[qid]?.sitelinks?.viwiki?.title;
  return viTitle ?? null;
}

export async function getWikipediaImage(query: string): Promise<WikiImageResult | null> {
  if (!query) return null;
  try {
    const cleanedQuery = stripGenericWords(query);
    if (!cleanedQuery) return null;

    const englishTitle = await findEnglishTitle(cleanedQuery);
    if (!englishTitle) return null;

    const vietnameseTitle = await getVietnameseTitle(englishTitle);
    if (!vietnameseTitle) return null;

    const summaryUrl = `https://vi.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(vietnameseTitle)}`;
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
