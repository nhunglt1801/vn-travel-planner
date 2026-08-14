import { useMemo, useState } from 'react';
import type { SuggestRequest, Place } from './types';
import { InputScreen, createDefaultSuggestRequest } from './screens/InputScreen';
import { SuggestionsScreen } from './screens/SuggestionsScreen';
import { DetailSheet } from './components/DetailSheet';
import { fetchSuggestions } from './api/suggest';

type Screen = 'input' | 'suggestions';

function computeTripDates(startDate: string, days: number): string[] {
  const [year, month, day] = startDate.split('-').map(Number);
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(year, month - 1, day + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${dd}`);
  }
  return dates;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('input');
  const [request, setRequest] = useState<SuggestRequest>(createDefaultSuggestRequest());
  const tripDates = useMemo(
    () => computeTripDates(request.startDate, request.days),
    [request.startDate, request.days],
  );

  const [suggestions, setSuggestions] = useState<Place[] | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  async function loadSuggestions(req: SuggestRequest) {
    setSuggestLoading(true);
    setSuggestError(null);
    setSuggestions(null);
    try {
      const res = await fetchSuggestions(req);
      setSuggestions(res.places);
    } catch {
      setSuggestError('Không tạo được gợi ý lúc này, thử lại nhé');
    } finally {
      setSuggestLoading(false);
    }
  }

  function handleSubmitRequest(req: SuggestRequest) {
    setRequest(req);
    setScreen('suggestions');
    loadSuggestions(req);
  }

  return (
    <>
      {screen === 'input' && <InputScreen initialValue={request} onSubmit={handleSubmitRequest} />}

      {screen === 'suggestions' && (
        <SuggestionsScreen
          places={suggestions}
          loading={suggestLoading}
          error={suggestError}
          onRetry={() => loadSuggestions(request)}
          onSelectPlace={setSelectedPlace}
          onBack={() => setScreen('input')}
        />
      )}

      {selectedPlace && (
        <DetailSheet
          place={selectedPlace}
          region={request.region || selectedPlace.region}
          dates={tripDates}
          onClose={() => setSelectedPlace(null)}
          onCreateItinerary={() => setSelectedPlace(null)}
        />
      )}
    </>
  );
}
