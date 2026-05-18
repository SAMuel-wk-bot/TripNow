import { ItineraryItemType, type Trip } from '@prisma/client';

import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/AppError';
import * as attractionsService from '../attractions/attractions.service';

import type {
  CreateTripInput,
  GenerateItineraryInput,
  UpdateTripInput,
} from './trips.schema';

export async function listTrips(userId: string): Promise<Trip[]> {
  return prisma.trip.findMany({
    where: { userId },
    orderBy: { startDate: 'desc' },
  });
}

export async function getTrip(userId: string, tripId: string) {
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId },
    include: { itineraryItems: { orderBy: [{ startsAt: 'asc' }, { orderIndex: 'asc' }] } },
  });
  if (!trip) throw new NotFoundError('Trip not found');
  return trip;
}

export async function createTrip(userId: string, input: CreateTripInput): Promise<Trip> {
  return prisma.trip.create({
    data: {
      userId,
      title: input.title,
      destination: input.destination,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      budgetCents: input.budgetCents,
      currency: input.currency,
      notes: input.notes,
    },
  });
}

export async function updateTrip(
  userId: string,
  tripId: string,
  input: UpdateTripInput,
): Promise<Trip> {
  await ensureOwnership(userId, tripId);
  return prisma.trip.update({
    where: { id: tripId },
    data: {
      ...input,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    },
  });
}

export async function deleteTrip(userId: string, tripId: string): Promise<void> {
  await ensureOwnership(userId, tripId);
  await prisma.trip.delete({ where: { id: tripId } });
}

export async function generateItinerary(userId: string, input: GenerateItineraryInput) {
  const trip = await prisma.trip.findFirst({ where: { id: input.tripId, userId } });
  if (!trip) throw new NotFoundError('Trip not found');

  const days = Math.max(
    1,
    Math.ceil(
      (trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24),
    ),
  );

  const attractions = await attractionsService.searchAttractions({
    city: trip.destination,
    limit: Math.min(50, days * activitiesPerDay(input.pace)),
  });

  const perDay = activitiesPerDay(input.pace);
  const items = [];
  let cursor = 0;

  for (let day = 0; day < days; day++) {
    const dayStart = new Date(trip.startDate);
    dayStart.setDate(dayStart.getDate() + day);
    dayStart.setHours(9, 0, 0, 0);

    for (let slot = 0; slot < perDay && cursor < attractions.length; slot++) {
      const attraction = attractions[cursor++];
      const startsAt = new Date(dayStart);
      startsAt.setHours(9 + slot * 3);
      const endsAt = new Date(startsAt);
      endsAt.setHours(endsAt.getHours() + 2);

      items.push({
        tripId: trip.id,
        type: ItineraryItemType.ATTRACTION,
        title: attraction.name,
        description: attraction.description ?? null,
        startsAt,
        endsAt,
        location: `${attraction.city}, ${attraction.country}`,
        latitude: attraction.latitude,
        longitude: attraction.longitude,
        orderIndex: slot,
        metadata: { attractionId: attraction.id, categories: attraction.categories },
      });
    }
  }

  if (items.length > 0) {
    await prisma.itineraryItem.createMany({ data: items });
  }

  return getTrip(userId, trip.id);
}

async function ensureOwnership(userId: string, tripId: string): Promise<void> {
  const trip = await prisma.trip.findFirst({ where: { id: tripId, userId } });
  if (!trip) throw new NotFoundError('Trip not found');
}

function activitiesPerDay(pace: GenerateItineraryInput['pace']): number {
  switch (pace) {
    case 'RELAXED':
      return 2;
    case 'PACKED':
      return 5;
    default:
      return 3;
  }
}
