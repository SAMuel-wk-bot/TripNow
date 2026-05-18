import { logger } from '../../config/logger';

import type { FlightSearchInput } from './flights.schema';
import type { FlightOffer, FlightProvider } from './flights.types';
import { amadeusProvider } from './providers/amadeus.provider';

const providers: FlightProvider[] = [amadeusProvider];

export async function searchFlights(input: FlightSearchInput): Promise<FlightOffer[]> {
  const results = await Promise.allSettled(providers.map((p) => p.search(input)));

  const offers = results.flatMap((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    logger.error({ err: r.reason, provider: providers[i].name }, 'Flight provider failed');
    return [];
  });

  return offers.sort((a, b) => a.totalPrice - b.totalPrice);
}
