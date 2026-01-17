import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load Environment Variables
dotenv.config();

// Import ALL Models to ensure complete cleanup
import User from './src/models/user.model.js';
import Department from './src/models/Department.js';
import Program from './src/models/Program.js';
import Participant from './src/models/Participant.js';
import BroadcastLog from './src/models/broadcastLog.model.js';

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("🔥 Connected to DB...");

        // --- 1. WIPE EVERYTHING (The Clean Slate) ---
        console.log("💥 Deleting ALL existing data...");
        await Promise.all([
            User.deleteMany({}),
            Department.deleteMany({}),
            Program.deleteMany({}),       // <--- Critical: Remove old programs
            Participant.deleteMany({}),   // <--- Critical: Remove old participants
            BroadcastLog.deleteMany({})   // <--- Critical: Remove old logs
        ]);
        console.log("✅ All collections cleared.");

        // --- 2. CREATE DEPARTMENTS ---
        const deptNames = [
            "Directorate", 
            "ICT", 
            "Human Resources", 
            "Operations", 
            "Finance", 
            "Programs",
            "Media & Communications"
        ];
        
        const createdDepts = [];

        console.log("🌱 Seeding Departments...");
        for (const name of deptNames) {
            const d = await Department.create({ 
                name, 
                description: `${name} Department`,
                staffCount: 0 
            });
            createdDepts.push(d);
        }

        // --- 3. CREATE SUPER ADMIN ---
        // We link the Super Admin to 'Directorate' (or whichever you prefer)
        const directorate = createdDepts.find(d => d.name === "Directorate");
        
        console.log("👑 Creating Super Admin...");
        await User.create({
            name: "System Administrator",
            email: "kabiruusmanshamaki@gmail.com",
            password: "00000000", // Change this immediately after login!
            role: "SUPER_ADMIN",
            status: "Active",
            department: directorate._id, 
            isProfileComplete: true
        });

        console.log(`
        -------------------------------------------
        ✅ SYSTEM RESET SUCCESSFULLY
        You can now log in with the following credentials:      
        -------------------------------------------
        Login Email:    kabiruusmanshamaki@gmail.com
        Login Password: 00000000
        -------------------------------------------
        `);

        process.exit();
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
};

seedData();