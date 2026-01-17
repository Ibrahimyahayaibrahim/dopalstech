import express from 'express';
import { 
  createProgram, getAllPrograms, getProgramsByDepartment, getProgramById, 
  updateProgram, updateProgramStatus, markProgramComplete, addProgramUpdate,
  addParticipants, addParticipantManually, importParticipants, removeParticipant 
} from '../controllers/program.controller.js'; 
import { protect } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js'; 

const router = express.Router();

router.route('/')
  .get(protect, getAllPrograms)
  .post(protect, upload.fields([{ name: 'flyer', maxCount: 1 }, { name: 'proposal', maxCount: 1 }]), createProgram); 

router.get('/department/:departmentId', protect, getProgramsByDepartment);

router.put('/:id/status', protect, updateProgramStatus);

// ✅ UPDATED: Add 'upload.single' for the completion document
router.put('/:id/complete', protect, upload.single('finalDocument'), markProgramComplete);

router.post('/:id/updates', protect, addProgramUpdate);
router.post('/:id/participants', protect, addParticipants);
router.post('/:id/participants/add', protect, addParticipantManually);
router.post('/:id/participants/import', protect, importParticipants);
router.delete('/:id/participants/:participantId', protect, removeParticipant);

router.route('/:id')
  .get(protect, getProgramById)
  .put(protect, upload.fields([{ name: 'flyer' }, { name: 'proposal' }]), updateProgram);

export default router;