import { Router } from 'express';

import aiRoutes from '../modules/ai/ai.routes';
import attractionsRoutes from '../modules/attractions/attractions.routes';
import authRoutes from '../modules/auth/auth.routes';
import carsRoutes from '../modules/cars/cars.routes';
import flightsRoutes from '../modules/flights/flights.routes';
import paymentsRoutes from '../modules/payments/payments.routes';
import tripsRoutes from '../modules/trips/trips.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/flights', flightsRoutes);
router.use('/cars', carsRoutes);
router.use('/attractions', attractionsRoutes);
router.use('/trips', tripsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/ai', aiRoutes);

export default router;
