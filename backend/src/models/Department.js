import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true 
    },
    
    // ✅ FIX: This field is required for the new Controller to work
    headOfDepartment: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        default: null
    },

    description: { 
        type: String 
    },

    // Optional: Keep track of members if your logic uses it
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { 
    timestamps: true 
});

const Department = mongoose.model('Department', departmentSchema);

export default Department;