import type { Request, Response } from 'express';

import * as carsService from './cars.service';

export async function searchCarsHandler(req: Request, res: Response): Promise<void> {
  const offers = await carsService.searchCars(req.query as never);
  res.json({ count: offers.length, offers });
}
