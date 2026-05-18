import type { Request, Response } from 'express';

import * as flightsService from './flights.service';

export async function searchFlightsHandler(req: Request, res: Response): Promise<void> {
  const offers = await flightsService.searchFlights(req.query as never);
  res.json({ count: offers.length, offers });
}
