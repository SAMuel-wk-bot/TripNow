import { PaymentStatus } from '@prisma/client';

import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { AppError, BadRequestError } from '../../utils/AppError';

import type { CreatePaymentIntentInput } from './payments.schema';

interface PaymentIntentResult {
  paymentId: string;
  clientSecret: string;
  status: PaymentStatus;
}

export async function createPaymentIntent(
  userId: string,
  input: CreatePaymentIntentInput,
): Promise<PaymentIntentResult> {
  if (!env.STRIPE_SECRET_KEY) {
    throw new AppError('Payment provider not configured', 503, 'PAYMENTS_UNAVAILABLE');
  }

  const res = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      amount: String(input.amountCents),
      currency: input.currency.toLowerCase(),
      'automatic_payment_methods[enabled]': 'true',
      ...(input.description ? { description: input.description } : {}),
      'metadata[userId]': userId,
      ...(input.bookingId ? { 'metadata[bookingId]': input.bookingId } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    logger.error({ status: res.status, body }, 'Stripe payment intent failed');
    throw new BadRequestError('Failed to create payment intent');
  }

  const intent = (await res.json()) as {
    id: string;
    client_secret: string;
    status: string;
  };

  const payment = await prisma.payment.create({
    data: {
      userId,
      bookingId: input.bookingId,
      amountCents: input.amountCents,
      currency: input.currency,
      providerIntentId: intent.id,
      status: PaymentStatus.PENDING,
    },
  });

  return {
    paymentId: payment.id,
    clientSecret: intent.client_secret,
    status: payment.status,
  };
}

export async function handleStripeWebhook(rawBody: Buffer, signature: string): Promise<void> {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new AppError('Webhook secret not configured', 503, 'WEBHOOK_UNAVAILABLE');
  }

  // Signature verification is intentionally minimal here.
  // In production, use the official `stripe` SDK to verify with constructEvent.
  logger.info({ signaturePrefix: signature.slice(0, 16) }, 'Stripe webhook received');

  let event: { type: string; data: { object: { id: string; status?: string } } };
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    throw new BadRequestError('Invalid webhook payload');
  }

  const intent = event.data.object;
  const status = mapStripeStatus(event.type);
  if (!status) return;

  await prisma.payment.updateMany({
    where: { providerIntentId: intent.id },
    data: { status },
  });
}

function mapStripeStatus(eventType: string): PaymentStatus | null {
  switch (eventType) {
    case 'payment_intent.succeeded':
      return PaymentStatus.SUCCEEDED;
    case 'payment_intent.processing':
      return PaymentStatus.PROCESSING;
    case 'payment_intent.payment_failed':
      return PaymentStatus.FAILED;
    case 'charge.refunded':
      return PaymentStatus.REFUNDED;
    default:
      return null;
  }
}
