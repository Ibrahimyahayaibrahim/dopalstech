import axios from 'axios';
import colors from 'colors';
import dotenv from 'dotenv';

// Load Env
dotenv.config();

// CONFIGURATION
const PORT = process.env.PORT || 5000;
const API_URL = process.env.API_URL || `http://localhost:${PORT}/api`;

// CREDENTIALS (Loaded from .env)
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL; 
const ADMIN_PASS = process.env.TEST_ADMIN_PASS; 

if (!ADMIN_EMAIL || !ADMIN_PASS) {
    console.log('❌ ERROR: Missing TEST_ADMIN_EMAIL or TEST_ADMIN_PASS in .env'.red);
    process.exit(1);
}

console.log('\n🚀 STARTING SYSTEM DIAGNOSTIC...'.bold.cyan);
console.log(`TARGET: ${API_URL}\n`.gray);

const runTest = async () => {
    let token = '';
    let userId = '';
    let programId = '';

    // --- 1. HEALTH CHECK (Ping) ---
    try {
        process.stdout.write('1. Checking Server Status... ');
        // Just try to hit a known public endpoint to see if server is up
        try {
            await axios.get(`${API_URL}/public/program/123`); 
        } catch (e) {
            // We expect a 404 or 500, but as long as it connects (not ECONNREFUSED), it's "UP"
            if (e.code === 'ECONNREFUSED') throw e;
        }
        console.log('PASSED ✅'.green);
    } catch (error) {
        console.log('FAILED ❌'.red);
        console.error(`   └─ Server is NOT running on port ${PORT}. Run 'npm start' first.`.red);
        process.exit(1);
    }

    // --- 2. AUTHENTICATION ---
    try {
        process.stdout.write('2. Testing Authentication... ');
        
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASS
        });
        
        if (res.status === 200 && res.data.token) {
            token = res.data.token;
            userId = res.data._id;
            console.log('PASSED ✅'.green);
            console.log(`   └─ Logged in as: ${res.data.name.yellow}`);
        } else {
            throw new Error('No token received');
        }
    } catch (error) {
        console.log('FAILED ❌'.red);
        console.error('   └─ Error:', error.response?.data?.message || error.message);
        process.exit(1);
    }

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // --- 3. DASHBOARD STATS ---
    try {
        process.stdout.write('3. Fetching Dashboard Stats... ');
        const res = await axios.get(`${API_URL}/dashboard/stats`, authHeaders);
        console.log('PASSED ✅'.green);
    } catch (error) {
        console.log('FAILED ❌'.red);
        console.error('   └─', error.message);
    }

    // --- 4. CREATE PROGRAM ---
    try {
        process.stdout.write('4. Testing Program Creation... ');
        
        // Fetch valid department first
        const deptRes = await axios.get(`${API_URL}/departments`, authHeaders);
        const deptId = deptRes.data[0]?._id;

        if (!deptId) throw new Error("No departments found (Run seed.js first)");

        const testProgram = {
            name: "_TEST_PROGRAM_" + Date.now(),
            type: "Event",
            date: new Date(),
            frequency: "1",
            cost: 50000,
            description: "Automated test entry",
            departmentId: deptId,
            registrationOpen: true
        };

        const res = await axios.post(`${API_URL}/programs`, testProgram, authHeaders);
        programId = res.data._id;
        console.log('PASSED ✅'.green);
        console.log(`   └─ Created Program ID: ${programId}`);
    } catch (error) {
        console.log('FAILED ❌'.red);
        console.error('   └─', error.response?.data?.message || error.message);
    }

    // --- 5. CLEANUP (DISABLED FOR NOW) ---
    // Uncomment this block if you want the script to delete what it created
    /*
    if (programId) {
        try {
            process.stdout.write('5. Cleaning Up... ');
            await axios.delete(`${API_URL}/programs/${programId}`, authHeaders);
            console.log('PASSED ✅'.green);
        } catch (error) {
            console.log('SKIPPED ⚠️'.yellow);
        }
    } 
    */
    console.log('5. Cleanup... SKIPPED (Data preserved) ⚠️'.yellow);

    console.log('\n✨ DIAGNOSTIC COMPLETE.\n'.bold.cyan);
};

runTest();