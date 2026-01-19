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
    updateUserPassword 
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

// 👇 ✅ CHANGE THIS LINE: Import from your Cloudinary config, not the old middleware
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

// 👇 ✅ Ensure 'profilePicture' matches the name your Frontend uses in FormData.append('profilePicture', file)
router.put('/profile/image', protect, upload.single('profilePicture'), updateProfileImage);

router.put('/password', protect, updateUserPassword);

// --- Department Management Routes ---
router.post('/remove-dept', protect, removeFromDepartment);
router.post('/migrate', protect, migrateStaff);
router.post('/add-to-dept', protect, addToDepartment); 

export default router;