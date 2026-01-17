import ActivityLog from '../models/ActivityLog.js';

export const getActivities = async (req, res) => {
  try {
    const { role, departments } = req.user;
    let query = {};

    // 1. Super Admin: Sees EVERYTHING
    if (role === 'SUPER_ADMIN') {
        query = {}; 
    } 
    // 2. Admin: Sees activity in THEIR Departments + Their own actions
    else if (role === 'ADMIN') {
        const deptIds = departments.map(d => d._id || d);
        query = { 
            $or: [
                { department: { $in: deptIds } },
                { user: req.user._id }
            ]
        };
    } 
    // 3. Staff: Access Denied (Double check)
    else {
        return res.status(403).json({ message: "Access Denied" });
    }

    const logs = await ActivityLog.find(query)
        .populate('user', 'name role profilePicture')
        .populate('department', 'name')
        .sort({ createdAt: -1 }) // Newest first
        .limit(50); // Limit to last 50 actions

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};