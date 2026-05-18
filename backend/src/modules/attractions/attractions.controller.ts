import type { Request, Response } from 'express';

import * as attractionsService from './attractions.service';

export async function searchAttractionsHandler(req: Request, res: Response): Promise<void> {
  const results = await attractionsService.searchAttractions(req.query as never);
  res.json({ count: results.length, attractions: results });
}

export async function getAttractionHandler(req: Request, res: Response): Promise<void> {
  const result = await attractionsService.getAttractionById(req.params.id);
  res.json(result);
}
