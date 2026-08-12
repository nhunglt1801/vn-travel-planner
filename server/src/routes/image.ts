import { Router } from 'express';
import { resolveImage } from '../services/imageFallback.js';

const router = Router();

router.get('/image', async (req, res) => {
  const query = String(req.query.query ?? '');
  const tag = String(req.query.tag ?? '');
  const place = String(req.query.place || query || 'travel');
  const queries = [query, tag, 'travel destination'].filter(Boolean);

  const result = await resolveImage(queries, place);
  res.json(result);
});

export default router;
