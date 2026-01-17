import Program from '../models/Program.js';
import Participant from '../models/Participant.js';

export const getImpactAnalytics = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const startDate = new Date(`${currentYear}-01-01`);
    const endDate = new Date(`${currentYear}-12-31`);

    // --- SECURITY CHECK ---
    const canSeeFinance = ['SUPER_ADMIN', 'ADMIN', 'DEPT_ADMIN'].includes(req.user.role);

    // 1. GROWTH DATA (Participants vs Startups)
    const growthData = await Program.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate }, status: { $ne: 'Rejected' } } },
      {
        $group: {
          _id: { $month: "$date" },
          // FIX: Use $ifNull to handle missing 'participants' arrays safely
          participants: { 
            $sum: { 
              $size: { $ifNull: ["$participants", []] } 
            } 
          }, 
          startups: { $sum: "$startupsCount" },
          programCount: { $sum: 1 }
        }
      }
    ]);

    // 2. FINANCE DATA (Only fetch if authorized)
    let financeData = [];
    if (canSeeFinance) {
      financeData = await Program.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate }, status: { $ne: 'Rejected' } } },
        {
          $group: {
            _id: { $month: "$date" },
            budget: { $sum: "$cost" },
            disbursed: { $sum: "$amountDisbursed" }
          }
        }
      ]);
    }

    // 3. DEMOGRAPHICS (Male vs Female)
    const demographyData = await Participant.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          male: { $sum: { $cond: [{ $eq: ["$gender", "Male"] }, 1, 0] } },
          female: { $sum: { $cond: [{ $eq: ["$gender", "Female"] }, 1, 0] } }
        }
      }
    ]);

    // --- MERGE & FORMAT DATA ---
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const formattedData = months.map((month, index) => {
      const monthIdx = index + 1;
      
      const g = growthData.find(d => d._id === monthIdx) || {};
      const f = financeData.find(d => d._id === monthIdx) || {};
      const d = demographyData.find(d => d._id === monthIdx) || {};

      return {
        name: month,
        // Growth
        participants: g.participants || 0,
        startups: g.startups || 0,
        programCount: g.programCount || 0,
        // Finance
        budget: canSeeFinance ? (f.budget || 0) : 0,
        disbursed: canSeeFinance ? (f.disbursed || 0) : 0,
        // Demographics
        male: d.male || 0,
        female: d.female || 0,
      };
    });

    res.json(formattedData);

  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({ message: error.message });
  }
};