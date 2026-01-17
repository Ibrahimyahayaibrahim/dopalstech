import mongoose from 'mongoose';

const updateSchema = new mongoose.Schema({
  text: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now }
});

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
  date: { type: Date }, 
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, default: 'Pending' }, 
  cost: { type: Number, default: 0 },
  description: { type: String },
  venue: { type: String },
  frequency: { type: String }, 
  flyer: { type: String },
  proposal: { type: String },
  courseTitle: { type: String },
  startupsCount: { type: Number, default: 0 },

  registration: {
    isOpen: { type: Boolean, default: true },
    deadline: { type: Date },
    linkSlug: { type: String, unique: true, sparse: true }, 
    formFields: [formFieldSchema] 
  },

  updates: [updateSchema],
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Participant' }],
  participantsCount: { type: Number, default: 0 },

  // ✅ NEW: COMPLETION FIELDS
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