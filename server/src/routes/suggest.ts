import { Router } from 'express';
import { getSuggestions } from '../services/openai.js';

const router = Router();

router.post('/suggest', async (req, res) => {
  try {
    const places = await getSuggestions(req.body);
    res.json({ places });
  } catch {
    res.status(502).json({ message: 'Không tạo được gợi ý lúc này, thử lại nhé' });
  }
});

export default router;
