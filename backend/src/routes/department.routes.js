import express from 'express';
import { 
  createDepartment, 
  getDepartments, 
  getDepartmentById, 
  deleteDepartment // <--- Import this
} from '../controllers/department.controller.js';
import { protect } from '../middleware/auth.middleware.js'; // Ensure we have protection

const router = express.Router();

router.route('/')
  .get(getDepartments)
  .post(protect, createDepartment); // Ensure create is protected

// Update this route to handle GET (view) and DELETE (remove)
router.route('/:id')
  .get(getDepartmentById)
  .delete(protect, deleteDepartment); // <--- Add this line

export default router;