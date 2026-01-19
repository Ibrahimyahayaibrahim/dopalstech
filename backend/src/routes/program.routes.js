import express from 'express';
import { 
    createProgram, 
    getAllPrograms, 
    getProgramById, 
    updateProgram, 
    updateProgramStatus,
    markProgramComplete,
    addProgramUpdate,
    addParticipantManually,
    importParticipants,
    removeParticipant,
    getPublicProgram,
    registerParticipant,
    getProgramsByDepartment
} from '../controllers/program.controller.js';

// Middleware
import { protect, authorize } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js'; // Ensure you have this

const router = express.Router();

// --- PUBLIC ROUTES (Registration) ---
router.get('/public/:id', getPublicProgram);
router.post('/public/:programId/register', registerParticipant);

// --- PROTECTED ROUTES ---
router.use(protect); // All routes below require login

// 1. Program Management
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'STAFF'), upload.fields([{ name: 'flyer', maxCount: 1 }, { name: 'proposal', maxCount: 1 }]), createProgram);
router.get('/', getAllPrograms);
router.get('/department/:departmentId', getProgramsByDepartment);
router.get('/:id', getProgramById);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateProgram);

// 2. Status & Actions
router.put('/:id/status', authorize('SUPER_ADMIN', 'ADMIN'), updateProgramStatus);

// ✅ NEW: Complete Program (With File Upload for Final Report)
router.put('/:id/complete', authorize('SUPER_ADMIN', 'ADMIN'), upload.single('finalDocument'), markProgramComplete);

// 3. Updates/Chat
router.post('/:id/updates', addProgramUpdate);

// 4. Participant Management
router.post('/:id/participants/add', authorize('SUPER_ADMIN', 'ADMIN'), addParticipantManually);
router.post('/:id/participants/import', authorize('SUPER_ADMIN', 'ADMIN'), importParticipants);
router.delete('/:id/participants/:participantId', authorize('SUPER_ADMIN', 'ADMIN'), removeParticipant);

export default router;