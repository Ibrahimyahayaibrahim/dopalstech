import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { sendBroadcast, getBroadcastHistory } from '../controllers/broadcast.controller.js';

const router = express.Router();

router.post('/send', protect, authorize('SUPER_ADMIN', 'ADMIN'), sendBroadcast);
router.get('/history', protect, authorize('SUPER_ADMIN', 'ADMIN'), getBroadcastHistory); // <--- New Route

export default router;