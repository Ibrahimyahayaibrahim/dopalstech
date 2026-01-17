// backend/reset-password.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/user.model.js'; // Adjust path if needed

dotenv.config();

const resetUserPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // REPLACE THIS WITH THE EMAIL OF THE USER YOU CAN'T LOGIN TO
        const emailToReset = "muhammadabdullahijibrin0@gmail.com"; 

        const user = await User.findOne({ email: emailToReset });

        if (!user) {
            console.log('❌ User not found!');
            process.exit(1);
        }

        // Manually set a temporary password
        // The pre('save') middleware in your model will hash this automatically
        user.password = "123456"; 
        
        // Ensure the status allows login
        user.status = "Active"; 
        // We set this to true so you can access the dashboard immediately
        user.isProfileComplete = true; 

        await user.save();

        console.log(`✅ SUCCESS! Password for ${user.email} reset to: 123456`);
        console.log(`✅ Status set to: Active`);
        
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

resetUserPassword();