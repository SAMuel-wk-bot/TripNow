import type { Request, Response } from 'express';

import { UnauthorizedError } from '../../utils/AppError';

import * as tripsService from './trips.service';

function userId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.sub;
}

export async function listTripsHandler(req: Request, res: Response): Promise<void> {
  const trips = await tripsService.listTrips(userId(req));
  res.json({ count: trips.length, trips });
}

export async function getTripHandler(req: Request, res: Response): Promise<void> {
  const trip = await tripsService.getTrip(userId(req), req.params.id);
  res.json(trip);
}

export async function createTripHandler(req: Request, res: Response): Promise<void> {
  const trip = await tripsService.createTrip(userId(req), req.body);
  res.status(201).json(trip);
}

export async function updateTripHandler(req: Request, res: Response): Promise<void> {
  const trip = await tripsService.updateTrip(userId(req), req.params.id, req.body);
  res.json(trip);
}

export async function deleteTripHandler(req: Request, res: Response): Promise<void> {
  await tripsService.deleteTrip(userId(req), req.params.id);
  res.status(204).send();
}

export async function generateItineraryHandler(req: Request, res: Response): Promise<void> {
  const trip = await tripsService.generateItinerary(userId(req), {
    ...req.body,
    tripId: req.params.id,
  });
  res.json(trip);
}
