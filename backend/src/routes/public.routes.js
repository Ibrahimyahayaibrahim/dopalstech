import express from 'express';
// ✅ FIX: Import from 'program.controller.js', because that is where we added the logic!
import { getPublicProgram, registerParticipant } from '../controllers/program.controller.js';

const router = express.Router();

// Public Routes (No 'protect' middleware)
router.get('/program/:id', getPublicProgram);
router.post('/register/:programId', registerParticipant);

export default router;