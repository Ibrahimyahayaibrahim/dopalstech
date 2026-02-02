import express from 'express';
import {
  createProgram,
  getAllPrograms,
  getProgramById,
  updateProgram,
  updateProgramStatus,
  markProgramComplete,
  getPublicProgram,
  registerParticipant,
  getProgramsByDepartment
} from '../controllers/program.controller.js';

import { protect, authorize } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

// --- PUBLIC ROUTES ---
router.get('/public/:id', getPublicProgram);
router.post('/public/:programId/register', registerParticipant);

// --- PROTECTED ROUTES ---
router.use(protect);

router.post(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN', 'STAFF'),
  // ✅ FIX: Ensure 'finalDocument' is listed here
  upload.fields([
    { name: 'flyer', maxCount: 1 },
    { name: 'proposal', maxCount: 1 },
    { name: 'finalDocument', maxCount: 1 } 
  ]),
  createProgram
);

router.get('/', getAllPrograms);
router.get('/department/:departmentId', getProgramsByDepartment);
router.get('/:id', getProgramById);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateProgram);
router.put('/:id/status', authorize('SUPER_ADMIN', 'ADMIN'), updateProgramStatus);
router.put('/:id/complete', authorize('SUPER_ADMIN', 'ADMIN'), upload.single('finalDocument'), markProgramComplete);

export default router;