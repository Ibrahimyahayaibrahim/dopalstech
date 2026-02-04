import express from 'express';
import { protect, admin } from '../middleware/auth.middleware.js';
import { 
    getAllUsers, 
    inviteUser, 
    toggleUserStatus, 
    deleteUser,
    getUserById, // ✅ Imported correctly
    getUserProfile, // For 'me' route (optional but good practice)
    updateUserProfile,
    updateProfileImage
} from '../controllers/user.controller.js';
import {upload} from '../middleware/upload.middleware.js'; // Ensure you have this or remove the profile route if not needed here

const router = express.Router();

// --- GENERAL ROUTES ---
router.get('/', protect, getAllUsers);
router.post('/invite', protect, admin, inviteUser);

// --- SPECIFIC USER ROUTES ---
// ⚠️ IMPORTANT: Put '/profile' BEFORE '/:id' so "profile" isn't treated as an ID
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/profile/image', protect, upload.single('image'), updateProfileImage);

// 3. ✅ Get Single User by ID
router.get('/:id', protect, getUserById);

// 4. Update Status
router.put('/:id/status', protect, admin, toggleUserStatus);

// 5. Delete User
router.delete('/:id', protect, admin, deleteUser);

export default router;