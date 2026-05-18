import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { NotFoundError } from '../../utils/AppError';

import type { AttractionsSearchInput } from './attractions.schema';

export interface AttractionDTO {
  id: string;
  externalId: string;
  source: string;
  name: string;
  description?: string | null;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  categories: string[];
  rating?: number | null;
  priceLevel?: number | null;
  openingHours?: unknown;
  imageUrl?: string | null;
}

export async function searchAttractions(
  input: AttractionsSearchInput,
): Promise<AttractionDTO[]> {
  const cached = await prisma.attraction.findMany({
    where: {
      city: { equals: input.city, mode: 'insensitive' },
      ...(input.country ? { country: input.country } : {}),
      ...(input.category ? { categories: { has: input.category } } : {}),
    },
    take: input.limit,
    orderBy: { rating: 'desc' },
  });

  if (cached.length > 0) {
    return cached;
  }

  const fetched = await fetchFromOpenTripMap(input);
  if (fetched.length === 0) {
    return [];
  }

  await prisma.$transaction(
    fetched.map((a) =>
      prisma.attraction.upsert({
        where: { externalId: a.externalId },
        create: a,
        update: a,
      }),
    ),
  );

  return fetched;
}

export async function getAttractionById(id: string): Promise<AttractionDTO> {
  const attraction = await prisma.attraction.findUnique({ where: { id } });
  if (!attraction) {
    throw new NotFoundError('Attraction not found');
  }
  return attraction;
}

async function fetchFromOpenTripMap(
  input: AttractionsSearchInput,
): Promise<Omit<AttractionDTO, 'id'>[]> {
  if (!env.OPENTRIPMAP_API_KEY) {
    logger.warn('OpenTripMap API key not configured');
    return [];
  }

  const geoRes = await fetch(
    `https://api.opentripmap.com/0.1/en/places/geoname?name=${encodeURIComponent(input.city)}&apikey=${env.OPENTRIPMAP_API_KEY}`,
  );
  if (!geoRes.ok) return [];
  const geo = (await geoRes.json()) as { lat: number; lon: number; country: string };

  const listRes = await fetch(
    `https://api.opentripmap.com/0.1/en/places/radius?radius=10000&lon=${geo.lon}&lat=${geo.lat}&limit=${input.limit}&format=json&apikey=${env.OPENTRIPMAP_API_KEY}`,
  );
  if (!listRes.ok) return [];

  const items = (await listRes.json()) as Array<{
    xid: string;
    name: string;
    point: { lon: number; lat: number };
    kinds: string;
    rate?: number;
  }>;

  return items
    .filter((i) => i.name)
    .map((i) => ({
      externalId: `otm-${i.xid}`,
      source: 'opentripmap',
      name: i.name,
      city: input.city,
      country: geo.country ?? input.country ?? 'XX',
      latitude: i.point.lat,
      longitude: i.point.lon,
      categories: i.kinds ? i.kinds.split(',') : [],
      rating: i.rate ?? null,
      description: null,
      priceLevel: null,
      openingHours: null,
      imageUrl: null,
    }));
}
