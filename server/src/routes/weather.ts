import { Router } from 'express';
import { geocode, getForecast } from '../services/openMeteo.js';
import type { WeatherDay } from '../types/index.js';

const router = Router();

router.get('/weather', async (req, res) => {
  const place = String(req.query.place ?? '');
  const region = req.query.region ? String(req.query.region) : undefined;
  const dates = String(req.query.dates ?? '').split(',').filter(Boolean);

  try {
    const location = await geocode(place, region);
    if (!location) {
      res.status(502).json({ message: 'Không tải được dự báo thời tiết lúc này' });
      return;
    }

    const forecast = await getForecast(location.lat, location.lon);
    const days: WeatherDay[] = dates.map((date) => {
      const day = forecast.get(date);
      if (!day) return { date, available: false };
      return {
        date,
        available: true,
        tempMin: day.tempMin,
        tempMax: day.tempMax,
        condition: day.condition,
        icon: day.icon,
      };
    });

    res.json({
      location: { lat: location.lat, lon: location.lon, resolvedName: location.resolvedName },
      days,
    });
  } catch {
    res.status(502).json({ message: 'Không tải được dự báo thời tiết lúc này' });
  }
});

export default router;
