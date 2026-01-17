import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { getGlobalStats, getDepartmentStats } from '../controllers/report.controller.js';

const router = express.Router();

// Define routes
router.get('/global', protect, authorize('SUPER_ADMIN', 'ADMIN'), getGlobalStats);
router.get('/departments', protect, authorize('SUPER_ADMIN', 'ADMIN'), getDepartmentStats);

// --- THIS WAS MISSING ---
export default router;