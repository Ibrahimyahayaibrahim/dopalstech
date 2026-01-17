import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async (userId, action, description, departmentId = null, meta = {}) => {
  try {
    await ActivityLog.create({
      user: userId,
      action,
      description,
      department: departmentId,
      meta
    });
  } catch (error) {
    console.error("Logging Error:", error);
    // Silent fail so it doesn't crash the main app
  }
};