import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet'; 
import connectDB from './src/config/db.js';
import { startCronJobs } from './src/services/cron.service.js';

// Route Imports
import authRoutes from './src/routes/auth.routes.js';
import departmentRoutes from './src/routes/department.routes.js';
import userRoutes from './src/routes/user.routes.js';
import dashboardRoutes from './src/routes/dashboard.routes.js';
import programRoutes from './src/routes/program.routes.js';
import uploadRoutes from './src/routes/upload.routes.js';
import broadcastRoutes from './src/routes/broadcast.routes.js';
import publicRoutes from './src/routes/public.routes.js';
import analyticsRoutes from './src/routes/analytics.routes.js';
import reportRoutes from './src/routes/report.routes.js';
import activityRoutes from './src/routes/activity.routes.js'; // 👈 ✅ 1. NEW IMPORT

if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
    console.error("FATAL ERROR: JWT_SECRET or MONGO_URI is missing");
    process.exit(1);
}

connectDB();
startCronJobs();
const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());

const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Routes
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/broadcast', broadcastRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/activities', activityRoutes); // 👈 ✅ 2. REGISTER MISSING ROUTE

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Production Server running on port ${PORT}`));