import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';

import { searchCarsHandler } from './cars.controller';
import { carSearchSchema } from './cars.schema';

const router = Router();

router.get(
  '/search',
  authenticate,
  validate(carSearchSchema, 'query'),
  asyncHandler(searchCarsHandler),
);

export default router;
