import type { Request, Response } from 'express';

import { UnauthorizedError } from '../../utils/AppError';

import * as paymentsService from './payments.service';

export async function createPaymentIntentHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const result = await paymentsService.createPaymentIntent(req.user.sub, req.body);
  res.status(201).json(result);
}

export async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
  const signature = req.header('stripe-signature') ?? '';
  await paymentsService.handleStripeWebhook(req.body as Buffer, signature);
  res.json({ received: true });
}
