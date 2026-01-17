import mongoose from 'mongoose';

const broadcastLogSchema = mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  audienceType: { type: String, required: true },
  targetPrograms: [{ type: String }], // Names or IDs of programs
  subject: { type: String, required: true },
  message: { type: String, required: true },
  recipientCount: { type: Number, required: true },
  status: { type: String, default: 'Sent' }
}, { timestamps: true });

const BroadcastLog = mongoose.model('BroadcastLog', broadcastLogSchema);
export default BroadcastLog;