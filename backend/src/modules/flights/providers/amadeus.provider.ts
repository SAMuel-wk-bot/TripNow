import { env } from '../../../config/env';
import { logger } from '../../../config/logger';
import type { FlightSearchInput } from '../flights.schema';
import type { FlightOffer, FlightProvider } from '../flights.types';

interface AmadeusToken {
  access_token: string;
  expires_at: number;
}

let cachedToken: AmadeusToken | null = null;

async function getAccessToken(): Promise<string | null> {
  if (!env.AMADEUS_CLIENT_ID || !env.AMADEUS_CLIENT_SECRET) {
    return null;
  }

  if (cachedToken && cachedToken.expires_at > Date.now() + 60_000) {
    return cachedToken.access_token;
  }

  const res = await fetch(`${env.AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env.AMADEUS_CLIENT_ID,
      client_secret: env.AMADEUS_CLIENT_SECRET,
    }),
  });

  if (!res.ok) {
    logger.error({ status: res.status }, 'Failed to get Amadeus token');
    return null;
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.access_token;
}

export const amadeusProvider: FlightProvider = {
  name: 'amadeus',
  async search(input: FlightSearchInput): Promise<FlightOffer[]> {
    const token = await getAccessToken();
    if (!token) {
      logger.warn('Amadeus credentials not configured, returning empty results');
      return [];
    }

    const params = new URLSearchParams({
      originLocationCode: input.origin,
      destinationLocationCode: input.destination,
      departureDate: input.departureDate,
      adults: String(input.adults),
      currencyCode: input.currency,
      travelClass: input.cabin,
      max: '20',
    });
    if (input.returnDate) params.set('returnDate', input.returnDate);
    if (input.children) params.set('children', String(input.children));
    if (input.maxPrice) params.set('maxPrice', String(Math.floor(input.maxPrice)));

    const res = await fetch(
      `${env.AMADEUS_BASE_URL}/v2/shopping/flight-offers?${params.toString()}`,
      { headers: { authorization: `Bearer ${token}` } },
    );

    if (!res.ok) {
      logger.error({ status: res.status }, 'Amadeus flight search failed');
      return [];
    }

    const data = (await res.json()) as { data: AmadeusOffer[] };
    return data.data.map(mapAmadeusOffer);
  },
};

interface AmadeusOffer {
  id: string;
  price: { total: string; currency: string };
  itineraries: Array<{
    duration: string;
    segments: Array<{
      departure: { iataCode: string; at: string };
      arrival: { iataCode: string; at: string };
      carrierCode: string;
      number: string;
      duration: string;
    }>;
  }>;
  validatingAirlineCodes: string[];
}

function mapAmadeusOffer(raw: AmadeusOffer): FlightOffer {
  return {
    id: raw.id,
    provider: 'amadeus',
    totalPrice: Number(raw.price.total),
    currency: raw.price.currency,
    airline: raw.validatingAirlineCodes[0] ?? 'UNKNOWN',
    itineraries: raw.itineraries.map((itin) => ({
      duration: itin.duration,
      segments: itin.segments.map((s) => ({
        origin: s.departure.iataCode,
        destination: s.arrival.iataCode,
        departureAt: s.departure.at,
        arrivalAt: s.arrival.at,
        carrier: s.carrierCode,
        flightNumber: s.number,
        duration: s.duration,
      })),
    })),
  };
}
