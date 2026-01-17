import express from 'express';
// --- FIX: Added 'getReportStats' to the import list ---
import { getDashboardStats, getChartData, getReportStats } from '../controllers/dashboard.controller.js'; 
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// 1. Dashboard Cards
router.get('/stats', protect, getDashboardStats);

// 2. Dashboard Charts
router.get('/charts', protect, getChartData);

// 3. Global Reports (This caused the error before because the import was missing)
router.get('/reports', protect, getReportStats);

export default router;