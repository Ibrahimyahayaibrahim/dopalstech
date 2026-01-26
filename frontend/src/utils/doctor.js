import API from '../services/api';

/**
 * Runs a full health check on the frontend-backend connection
 * Usage: Type 'window.runDoctor()' in the browser console.
 */
export const runDoctor = async () => {
    console.group('%c 🏥 SYSTEM DOCTOR ', 'background: #059669; color: #fff; padding: 4px; border-radius: 4px; font-weight: bold; font-size: 14px;');
    
    // 1. Check Local Storage
    console.log('%c 1. Checking Local Storage... ', 'color: #3b82f6; font-weight: bold;');
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (token) console.log(`✅ Token found: ${token.substring(0, 15)}...`);
    else console.error('❌ No Auth Token found.');

    if (user) console.log(`✅ User found: ${user.name} (${user.role})`);
    else console.error('❌ No User Data found.');

    // 2. Check API Latency
    console.log('%c 2. Checking Network Latency... ', 'color: #3b82f6; font-weight: bold;');
    const start = performance.now();
    try {
        const res = await API.get('/dashboard/stats');
        const duration = (performance.now() - start).toFixed(2);
        
        if (duration < 200) console.log(`🚀 Fast Response: ${duration}ms`);
        else if (duration < 800) console.log(`⚠️ Acceptable Response: ${duration}ms`);
        else console.warn(`🐌 Slow Response: ${duration}ms`);

        console.log('✅ API Connection Successful');
    } catch (err) {
        console.error('❌ API Connection Failed:', err.message);
        if (err.code === 'ERR_NETWORK') console.log('👉 Is the Backend Server running?');
    }

    // 3. Image Server Check
    console.log('%c 3. Checking Static Asset Server... ', 'color: #3b82f6; font-weight: bold;');
    const img = new Image();
    img.onload = () => console.log('✅ Static Files Serving Correctly');
    img.onerror = () => console.warn('⚠️ Static Files might be blocked or 404.');
    // Tries to load your logo from the backend
    img.src = 'http://localhost:5000/uploads/logo.png'; 

    console.groupEnd();
};