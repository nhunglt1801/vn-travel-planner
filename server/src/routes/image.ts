import { Router } from 'express';
import { resolveImage, pickFallbackImage } from '../services/imageFallback.js';

const router = Router();

router.get('/image', async (req, res) => {
  const query = String(req.query.query ?? '');
  const tag = String(req.query.tag ?? '');
  const place = String(req.query.place || query || 'travel');
  const queries = [query, tag, 'travel destination'].filter(Boolean);

  try {
    const result = await resolveImage(queries, place);
    res.json(result);
  } catch {
    res.json({ url: pickFallbackImage(place), alt: place, source: 'fallback' });
  }
});

export default router;
