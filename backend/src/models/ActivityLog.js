import mongoose from 'mongoose';

const activityLogSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // e.g. "USER_LOGIN", "CREATE_PROGRAM"
  description: { type: String, required: true }, // e.g. "John created 'Hackathon'"
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  meta: { type: Object, default: {} } // Extra info like IDs
}, { timestamps: true });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;