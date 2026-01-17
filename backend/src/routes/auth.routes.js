import express from 'express';
import { login } from '../controllers/auth.controller.js';

const router = express.Router();

// 🔓 PUBLIC (internal login only)
router.post('/login', login);

export default router;
