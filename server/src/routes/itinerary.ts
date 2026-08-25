import { Router } from 'express';
import { getItinerary } from '../services/openai.js';

const router = Router();

router.post('/itinerary', async (req, res) => {
  try {
    const days = await getItinerary(req.body);
    res.json({ days });
  } catch {
    res.status(502).json({ message: 'Không tạo được lịch trình lúc này, thử lại nhé' });
  }
});

export default router;
