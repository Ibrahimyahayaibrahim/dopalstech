import User from '../models/user.model.js';
import Department from '../models/Department.js';
import Program from '../models/Program.js';

// --- 1. GET CARD STATS ---
export const getDashboardStats = async (req, res) => {
  try {
    const user = req.user;
    let stats = {};

    // A. SUPER ADMIN & FINANCE MANAGER
    if (user.role === 'SUPER_ADMIN' || user.role === 'FINANCE_MANAGER') {
      const totalDepts = await Department.countDocuments();
      const totalStaff = await User.countDocuments({ role: { $ne: 'SUPER_ADMIN' } });
      const pendingApprovals = await Program.countDocuments({ status: 'Pending' });
      
      // 1. Total Programs Created (Replacing Ongoing)
      const totalPrograms = await Program.countDocuments({}); 

      // 2. People Impacted (Sum of participantsCount)
      const impactStats = await Program.aggregate([
        { $group: { _id: null, total: { $sum: "$participantsCount" } } }
      ]);
      const peopleImpacted = impactStats.length > 0 ? impactStats[0].total : 0;

      stats = {
        card1: { label: 'Total Departments', value: totalDepts },
        // Updated Label & Value
        card2: { label: 'Total Programs Created', value: totalPrograms }, 
        
        card3: { label: 'System Status', value: 'Operational' },
        card4: { label: 'Total Staff', value: totalStaff },
        
        // Updated Label & Value
        card5: { label: 'People Impacted', value: peopleImpacted }, 
        
        card6: { label: 'Pending Approvals', value: pendingApprovals }
      };
    } 
    // ... (Keep existing logic for Dept Admin & Regular Staff) ...
    // B. DEPARTMENT ADMIN
    else if (user.role === 'DEPT_ADMIN' || user.role === 'ADMIN') {
      const myDeptId = user.department;
      // You might want to update these too, but sticking to your request for Super Admin mostly
      const myPrograms = await Program.countDocuments({ department: myDeptId });
      const myStaff = await User.countDocuments({ department: myDeptId });
      const myPending = await Program.countDocuments({ department: myDeptId, status: 'Pending' });
      
      // Calculate Dept Impact
      const myImpactStats = await Program.aggregate([
        { $match: { department: myDeptId } }, // Filter by dept first
        { $group: { _id: null, total: { $sum: "$participantsCount" } } }
      ]);
      const myImpact = myImpactStats.length > 0 ? myImpactStats[0].total : 0;

      stats = {
        card1: { label: 'My Department', value: 'Active' },
        card2: { label: 'My Programs', value: myPrograms },
        card3: { label: 'Dept Status', value: 'Good' },
        card4: { label: 'My Staff', value: myStaff },
        card5: { label: 'People Impacted', value: myImpact }, 
        card6: { label: 'Pending Req.', value: myPending }
      };
    }
    // C. REGULAR STAFF
    else {
        // ... (Keep existing)
        stats = { 
            card1: { label: 'My Tasks', value: 0 },
            card2: { label: 'Active Projects', value: 0 },
            card3: { label: 'Status', value: 'Active' },
            card4: { label: 'Team Members', value: 0 },
            card5: { label: 'Completed', value: 0 },
            card6: { label: 'Pending', value: 0 }
        }; 
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ... (Keep existing getChartData & getReportStats)
export const getChartData = async (req, res) => {
    // ... existing code ...
    try {
        const programs = await Program.aggregate([
            { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const chart1Data = programs.map(p => ({
            name: monthNames[p._id - 1],
            programs: p.count
        }));

        const deptActivity = await Program.aggregate([
            { $group: { _id: "$department", value: { $sum: 1 } } },
            { $lookup: { from: "departments", localField: "_id", foreignField: "_id", as: "deptInfo" } },
            { $unwind: "$deptInfo" },
            { $project: { name: "$deptInfo.name", value: 1 } }
        ]);

        res.json({ chart1: chart1Data, chart2: deptActivity });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getReportStats = async (req, res) => {
    // ... existing code ...
    try {
        const { role, department } = req.user;
        let matchQuery = { status: 'Completed' };
        if (role !== 'SUPER_ADMIN' && role !== 'FINANCE_MANAGER') {
           matchQuery.department = department; 
        }
        // ... (The rest of your aggregation logic is fine, no changes needed here)
        const financials = await Program.aggregate([
          { $match: matchQuery },
          { $group: { _id: null, totalRequested: { $sum: "$cost" }, totalApproved: { $sum: "$cost" }, totalDisbursed: { $sum: "$amountDisbursed" } } }
        ]);
        let statusMatch = {};
        if (role !== 'SUPER_ADMIN' && role !== 'FINANCE_MANAGER') { statusMatch.department = department; }
        const statusCounts = await Program.aggregate([ { $match: statusMatch }, { $group: { _id: "$status", count: { $sum: 1 } } } ]);
        const deptActivity = await Program.aggregate([
          { $match: matchQuery },
          { $group: { _id: "$department", programCount: { $sum: 1 }, totalSpent: { $sum: "$cost" } } },
          { $lookup: { from: "departments", localField: "_id", foreignField: "_id", as: "deptInfo" } },
          { $unwind: "$deptInfo" },
          { $project: { name: "$deptInfo.name", programCount: 1, totalSpent: 1 } },
          { $sort: { totalSpent: -1 } }
        ]);
        const programsList = await Program.find(matchQuery).populate('department', 'name').populate('createdBy', 'name email').sort({ date: -1 }); 
        res.json({ financials: financials[0] || { totalRequested: 0, totalApproved: 0, totalDisbursed: 0 }, statusCounts, deptActivity, programsList });
    } catch (error) {
        console.error("Report Error:", error);
        res.status(500).json({ message: "Failed to generate reports" });
    }
};