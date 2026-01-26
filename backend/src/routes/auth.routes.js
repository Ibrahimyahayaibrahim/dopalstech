import express from 'express';
import { login, forgotPassword, resetPassword } from '../controllers/auth.controller.js';

const router = express.Router();

// 🔓 PUBLIC ROUTES
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);

export default router;