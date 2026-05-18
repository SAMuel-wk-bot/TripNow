import { Router } from 'express';

import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';

import { getAttractionHandler, searchAttractionsHandler } from './attractions.controller';
import { attractionsSearchSchema } from './attractions.schema';

const router = Router();

router.get(
  '/',
  validate(attractionsSearchSchema, 'query'),
  asyncHandler(searchAttractionsHandler),
);

router.get('/:id', asyncHandler(getAttractionHandler));

export default router;
