import express from 'express';
import { getImpactAnalytics } from '../controllers/analytics.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/impact', protect, getImpactAnalytics);

export default router;