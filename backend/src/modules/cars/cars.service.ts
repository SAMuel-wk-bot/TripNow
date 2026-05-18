import { env } from '../../config/env';
import { logger } from '../../config/logger';

import type { CarSearchInput } from './cars.schema';

export interface CarOffer {
  id: string;
  provider: string;
  supplier: string;
  vehicleClass: string;
  model: string;
  transmission: 'AUTOMATIC' | 'MANUAL';
  seats: number;
  doors: number;
  airConditioned: boolean;
  totalPrice: number;
  currency: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  dropoffDate: string;
  imageUrl?: string;
}

export async function searchCars(input: CarSearchInput): Promise<CarOffer[]> {
  if (!env.CAR_RENTAL_API_KEY || !env.CAR_RENTAL_BASE_URL) {
    logger.warn('Car rental provider not configured, returning mock data');
    return mockCarOffers(input);
  }

  const url = new URL('/v1/cars/search', env.CAR_RENTAL_BASE_URL);
  url.searchParams.set('pickup', input.pickupLocation);
  url.searchParams.set('dropoff', input.dropoffLocation ?? input.pickupLocation);
  url.searchParams.set('pickupDate', input.pickupDate);
  url.searchParams.set('dropoffDate', input.dropoffDate);
  url.searchParams.set('driverAge', String(input.driverAge));
  url.searchParams.set('currency', input.currency);

  const res = await fetch(url.toString(), {
    headers: { authorization: `Bearer ${env.CAR_RENTAL_API_KEY}` },
  });

  if (!res.ok) {
    logger.error({ status: res.status }, 'Car rental search failed');
    return [];
  }

  const data = (await res.json()) as { offers: CarOffer[] };
  return data.offers ?? [];
}

function mockCarOffers(input: CarSearchInput): CarOffer[] {
  return [
    {
      id: 'mock-economy-1',
      provider: 'mock',
      supplier: 'AvisDemo',
      vehicleClass: 'ECONOMY',
      model: 'Toyota Yaris or similar',
      transmission: 'MANUAL',
      seats: 5,
      doors: 4,
      airConditioned: true,
      totalPrice: 120,
      currency: input.currency,
      pickupLocation: input.pickupLocation,
      dropoffLocation: input.dropoffLocation ?? input.pickupLocation,
      pickupDate: input.pickupDate,
      dropoffDate: input.dropoffDate,
    },
    {
      id: 'mock-suv-1',
      provider: 'mock',
      supplier: 'HertzDemo',
      vehicleClass: 'SUV',
      model: 'Toyota RAV4 or similar',
      transmission: 'AUTOMATIC',
      seats: 5,
      doors: 5,
      airConditioned: true,
      totalPrice: 280,
      currency: input.currency,
      pickupLocation: input.pickupLocation,
      dropoffLocation: input.dropoffLocation ?? input.pickupLocation,
      pickupDate: input.pickupDate,
      dropoffDate: input.dropoffDate,
    },
  ];
}
