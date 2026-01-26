import express from 'express';
import { 
    createDepartment, 
    getDepartments, 
    getDepartmentById, 
    deleteDepartment,
    removeFromDepartment,
    assignDepartmentAdmin,
    revokeDepartmentAdmin
} from '../controllers/department.controller.js';
import { getDepartmentOverview } from "../controllers/departmentOverview.controller.js";
import { protect, admin } from '../middleware/auth.middleware.js';

const router = express.Router();

// 1. General Routes
router.route('/')
    .post(protect, admin, createDepartment)
    .get(protect, getDepartments);

// 2. ✅ MANAGEMENT ROUTES (MUST BE BEFORE /:id)
router.put('/assign-admin', protect, admin, assignDepartmentAdmin);
router.put('/revoke-admin', protect, admin, revokeDepartmentAdmin);
router.put('/remove-member', protect, admin, removeFromDepartment);
router.get("/:id/overview", protect, getDepartmentOverview);

// 3. Dynamic ID Routes
router.route('/:id')
    .get(protect, getDepartmentById)
    .delete(protect, admin, deleteDepartment);

export default router;