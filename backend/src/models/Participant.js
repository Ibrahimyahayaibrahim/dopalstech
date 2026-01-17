import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true, sparse: true },
  phone: { type: String, trim: true, sparse: true },
  
  // --- NEW FIELDS ---
  gender: { type: String, enum: ['Male', 'Female', 'Prefer not to say'] },
  organization: { type: String, trim: true }, // School or Company
  state: { type: String, trim: true },        // State of Residence
  referralSource: { type: String },           // How did they hear about us?
  // ------------------

  ageGroup: { type: String, enum: ['Under 18', '18-25', '26-35', '36-50', '50+'] },
  programs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Program' }], 
  consent: { type: Boolean, required: true }
}, { timestamps: true });

// Validation Middleware
participantSchema.pre('save', async function() {
  if (!this.email && !this.phone) {
    throw new Error('At least one contact method (Email or Phone) is required');
  }
});

const Participant = mongoose.model('Participant', participantSchema);
export default Participant;