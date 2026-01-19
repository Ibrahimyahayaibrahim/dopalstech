import mongoose from 'mongoose';

// 1. Schema for Chat Updates
const updateSchema = new mongoose.Schema({
  text: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ✅ LINKED TO USER MODEL
  date: { type: Date, default: Date.now }
});

// 2. Schema for Dynamic Registration Forms
const formFieldSchema = new mongoose.Schema({
  label: { type: String, required: true }, 
  fieldType: { 
    type: String, 
    required: true, 
    enum: ['text', 'textarea', 'number', 'date', 'select', 'file', 'checkbox'] 
  },
  required: { type: Boolean, default: false },
  options: [String] 
});

// 3. Main Program Schema
const programSchema = mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true, enum: ['Training', 'Event', 'Project', 'Pitch-IT'] },
  
  structure: { 
    type: String, 
    required: true, 
    enum: ['One-Time', 'Recurring', 'Numerical'], 
    default: 'One-Time' 
  },
  
  parentProgram: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', default: null },
  batchNumber: { type: Number }, 
  customSuffix: { type: String }, 
  versionLabel: { type: String }, 
  
  // ✅ Date is optional (Parent blueprints don't need dates)
  date: { type: Date }, 
  
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, default: 'Pending' }, 
  cost: { type: Number, default: 0 },
  description: { type: String },
  
  // ✅ Venue is optional
  venue: { type: String },
  
  frequency: { type: String }, 
  flyer: { type: String },
  proposal: { type: String },
  courseTitle: { type: String },
  
  // For Pitch-IT or similar
  startupsCount: { type: Number, default: 0 },

  registration: {
    isOpen: { type: Boolean, default: true },
    deadline: { type: Date },
    // ✅ Sparse: true ensures unique requirement is ignored if field is missing (good for drafts)
    linkSlug: { type: String, unique: true, sparse: true }, 
    formFields: [formFieldSchema] 
  },

  updates: [updateSchema], // Chat History
  
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Participant' }],
  participantsCount: { type: Number, default: 0 }, // Expected Attendees

  // Post-Event / Completion Data
  actualAttendance: { type: Number },
  actualDate: {
      start: { type: Date },
      end: { type: Date }
  },
  driveLink: { type: String }, 
  finalDocument: { type: String },
  amountDisbursed: { type: Number }

}, { timestamps: true });

const Program = mongoose.model('Program', programSchema);
export default Program;