import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        enum: ['SUPER_ADMIN', 'ADMIN', 'STAFF'], 
        default: 'STAFF' 
    },
    position: { type: String },
    departments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    }],
    profilePicture: { type: String },
    
    // --- STATUS FLAGS ---
    isProfileComplete: { 
        type: Boolean, 
        default: false 
    },
    status: { 
        type: String, 
        default: 'Pending' 
    },
    forcePasswordReset: {
        type: Boolean,
        default: false
    },

    // ✅ NEW: FORGOT PASSWORD FIELDS
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    
    // --- PROFILE DETAILS ---
    phone: { type: String },
    gender: { type: String },
    dob: { type: Date },
    address: { type: String },
    nin: { type: String },
    bio: { type: String },
    linkedin: { type: String },
    
    emergencyContact: {
        name: String,
        relationship: String,
        phone: String
    }

}, { timestamps: true });

// PASSWORD HASHING MIDDLEWARE
userSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// PASSWORD MATCHING METHOD
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;