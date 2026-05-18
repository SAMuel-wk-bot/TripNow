import express, { Router } from 'express';

import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';

import {
  createPaymentIntentHandler,
  stripeWebhookHandler,
} from './payments.controller';
import { createPaymentIntentSchema } from './payments.schema';

const router = Router();

router.post(
  '/intent',
  authenticate,
  validate(createPaymentIntentSchema),
  asyncHandler(createPaymentIntentHandler),
);

router.post(
  '/webhook/stripe',
  express.raw({ type: 'application/json' }),
  asyncHandler(stripeWebhookHandler),
);

export default router;
