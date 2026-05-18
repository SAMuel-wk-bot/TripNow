import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';

import {
  getConversationHandler,
  listConversationsHandler,
  sendMessageHandler,
} from './ai.controller';
import { sendMessageSchema } from './ai.schema';

const router = Router();

router.use(authenticate);

router.post('/messages', validate(sendMessageSchema), asyncHandler(sendMessageHandler));
router.get('/conversations', asyncHandler(listConversationsHandler));
router.get('/conversations/:id', asyncHandler(getConversationHandler));

export default router;
