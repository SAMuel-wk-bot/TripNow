import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';

import { searchFlightsHandler } from './flights.controller';
import { flightSearchSchema } from './flights.schema';

const router = Router();

router.get(
  '/search',
  authenticate,
  validate(flightSearchSchema, 'query'),
  asyncHandler(searchFlightsHandler),
);

export default router;
