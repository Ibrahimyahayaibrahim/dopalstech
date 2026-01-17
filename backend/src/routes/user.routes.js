import express from 'express';
import { 
    inviteUser, 
    getAllUsers, 
    getUserProfile, 
    updateUserProfile, 
    updateProfileImage,
    deleteUser,
    removeFromDepartment, 
    migrateStaff,         
    addToDepartment,
    toggleUserStatus,
    updateUserPassword // 👈 ✅ 1. IMPORT THIS
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

// --- User Management Routes ---
router.post('/invite', protect, inviteUser);
router.get('/', protect, getAllUsers);
router.delete('/:id', protect, deleteUser);
router.put('/:id/status', protect, toggleUserStatus);

// --- Profile Routes ---
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/profile/image', protect, upload.single('image'), updateProfileImage);

// ✅ 2. ADD THIS PASSWORD ROUTE
router.put('/password', protect, updateUserPassword);

// --- Department Management Routes ---
router.post('/remove-dept', protect, removeFromDepartment);
router.post('/migrate', protect, migrateStaff);
router.post('/add-to-dept', protect, addToDepartment); 

export default router;