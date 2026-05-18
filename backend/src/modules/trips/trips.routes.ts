import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';

import {
  createTripHandler,
  deleteTripHandler,
  generateItineraryHandler,
  getTripHandler,
  listTripsHandler,
  updateTripHandler,
} from './trips.controller';
import {
  createTripSchema,
  generateItinerarySchema,
  updateTripSchema,
} from './trips.schema';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(listTripsHandler));
router.post('/', validate(createTripSchema), asyncHandler(createTripHandler));
router.get('/:id', asyncHandler(getTripHandler));
router.patch('/:id', validate(updateTripSchema), asyncHandler(updateTripHandler));
router.delete('/:id', asyncHandler(deleteTripHandler));

router.post(
  '/:id/itinerary/generate',
  validate(generateItinerarySchema.omit({ tripId: true })),
  asyncHandler(generateItineraryHandler),
);

export default router;
