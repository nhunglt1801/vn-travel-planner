import { useMemo, useState } from 'react';
import type { SuggestRequest, ItineraryRequest, Place, ItineraryDay } from './types';
import { InputScreen, createDefaultSuggestRequest } from './screens/InputScreen';
import { SuggestionsScreen } from './screens/SuggestionsScreen';
import { ItineraryScreen } from './screens/ItineraryScreen';
import { DetailSheet } from './components/DetailSheet';
import { fetchSuggestions } from './api/suggest';
import { fetchItinerary } from './api/itinerary';

type Screen = 'input' | 'suggestions' | 'itinerary';

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

  const [itineraryPlaceName, setItineraryPlaceName] = useState('');
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[] | null>(null);
  const [itineraryLoading, setItineraryLoading] = useState(false);
  const [itineraryError, setItineraryError] = useState<string | null>(null);
  const [lastItineraryRequest, setLastItineraryRequest] = useState<ItineraryRequest | null>(null);

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

  async function loadItinerary(req: ItineraryRequest) {
    setItineraryLoading(true);
    setItineraryError(null);
    setItineraryDays(null);
    try {
      const res = await fetchItinerary(req);
      setItineraryDays(res.days);
    } catch {
      setItineraryError('Không tạo được lịch trình lúc này, thử lại nhé');
    } finally {
      setItineraryLoading(false);
    }
  }

  function handleCreateItinerary() {
    if (!selectedPlace) return;
    const itineraryRequest: ItineraryRequest = {
      placeName: selectedPlace.name,
      region: selectedPlace.region,
      country: selectedPlace.country,
      days: request.days,
      startDate: request.startDate,
      budget: request.budget,
      styles: request.styles,
      companion: request.companion,
    };
    setItineraryPlaceName(selectedPlace.name);
    setLastItineraryRequest(itineraryRequest);
    setSelectedPlace(null);
    setScreen('itinerary');
    loadItinerary(itineraryRequest);
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

      {screen === 'itinerary' && (
        <ItineraryScreen
          placeName={itineraryPlaceName}
          days={itineraryDays}
          loading={itineraryLoading}
          error={itineraryError}
          onRetry={() => lastItineraryRequest && loadItinerary(lastItineraryRequest)}
          onBack={() => setScreen('suggestions')}
        />
      )}

      {selectedPlace && screen === 'suggestions' && (
        <DetailSheet
          place={selectedPlace}
          region={selectedPlace.region || request.region || ''}
          dates={tripDates}
          onClose={() => setSelectedPlace(null)}
          onCreateItinerary={handleCreateItinerary}
        />
      )}
    </>
  );
}
