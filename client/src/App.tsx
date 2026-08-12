import { useState } from 'react';
import type { SuggestRequest, Place } from './types';
import { InputScreen, createDefaultSuggestRequest } from './screens/InputScreen';
import { SuggestionsScreen } from './screens/SuggestionsScreen';
import { fetchSuggestions } from './api/suggest';

type Screen = 'input' | 'suggestions';

export default function App() {
  const [screen, setScreen] = useState<Screen>('input');
  const [request, setRequest] = useState<SuggestRequest>(createDefaultSuggestRequest());

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
        <p style={{ position: 'fixed', bottom: 16, left: 16, right: 16, textAlign: 'center' }}>
          Đã chọn: {selectedPlace.name} — modal chi tiết sẽ được thêm ở Plan 2.
        </p>
      )}
    </>
  );
}
