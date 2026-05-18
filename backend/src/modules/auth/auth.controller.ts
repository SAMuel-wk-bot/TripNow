import type { Request, Response } from 'express';

import * as authService from './auth.service';

export async function registerHandler(req: Request, res: Response): Promise<void> {
  const tokens = await authService.register(req.body);
  res.status(201).json(tokens);
}

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const tokens = await authService.login(req.body);
  res.json(tokens);
}

export async function refreshHandler(req: Request, res: Response): Promise<void> {
  const tokens = await authService.refresh(req.body.refreshToken);
  res.json(tokens);
}
