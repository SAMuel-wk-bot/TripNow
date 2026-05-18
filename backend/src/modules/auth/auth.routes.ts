import { Router } from 'express';

import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';

import { loginHandler, refreshHandler, registerHandler } from './auth.controller';
import { loginSchema, refreshSchema, registerSchema } from './auth.schema';

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(registerHandler));
router.post('/login', validate(loginSchema), asyncHandler(loginHandler));
router.post('/refresh', validate(refreshSchema), asyncHandler(refreshHandler));

export default router;
