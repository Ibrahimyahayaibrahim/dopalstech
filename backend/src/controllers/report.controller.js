import Program from '../models/Program.js';
import User from '../models/user.model.js';
import Department from '../models/Department.js';

// --- 1. GET GLOBAL DASHBOARD STATS ---
export const getGlobalStats = async (req, res) => {
  try {
    console.log("--- DEBUG: Fetching Global Stats ---");
    
    // 1. Check raw counts first to verify DB connection
    const totalPrograms = await Program.countDocuments();
    const totalStaff = await User.countDocuments();
    
    console.log(`DEBUG: Found ${totalPrograms} Programs and ${totalStaff} Users.`);

    const [
        activePrograms,
        completedPrograms,
        pendingApprovals,
        // Aggregation for types
        programTypes,
        // Aggregation for impact
        impactStats
    ] = await Promise.all([
        Program.countDocuments({ status: 'Approved' }),
        Program.countDocuments({ status: 'Completed' }),
        Program.countDocuments({ status: 'Pending' }),
        Program.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]),
        Program.aggregate([{ $group: { _id: null, totalParticipants: { $sum: "$participantsCount" } } }])
    ]);

    const impact = impactStats[0] || { totalParticipants: 0 };

    res.json({
        overview: {
            totalPrograms,
            activePrograms,
            completedPrograms,
            pendingApprovals,
            totalStaff,
            peopleImpacted: impact.totalParticipants
        },
        breakdowns: {
            types: programTypes.map(t => ({ name: t._id, value: t.count }))
        }
    });
  } catch (error) {
    console.error("DEBUG ERROR in Global Stats:", error);
    res.status(500).json({ message: error.message });
  }
};

// --- 2. GET DEPARTMENT BREAKDOWN ---
export const getDepartmentStats = async (req, res) => {
    try {
        console.log("--- DEBUG: Fetching Department Stats ---");
        
        // 1. Fetch departments normally first
        const depts = await Department.find();
        console.log(`DEBUG: Found ${depts.length} Departments in DB.`);

        // 2. Perform the Lookup
        const stats = await Department.aggregate([
            {
                $lookup: {
                    from: "programs", // Ensure this matches your DB collection name (usually lowercase plural)
                    localField: "_id",
                    foreignField: "department",
                    as: "programs"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "department",
                    as: "staff"
                }
            },
            {
                $project: {
                    name: 1,
                    programCount: { $size: "$programs" },
                    staffCount: { $size: "$staff" },
                    impact: { $sum: "$programs.participantsCount" },
                    activePrograms: {
                        $size: {
                            $filter: {
                                input: "$programs",
                                as: "p",
                                cond: { $eq: ["$$p.status", "Approved"] }
                            }
                        }
                    }
                }
            },
            { $sort: { programCount: -1 } }
        ]);
        
        console.log("DEBUG: Aggregation Result (First Item):", stats[0]);
        res.json(stats);
    } catch (error) {
        console.error("DEBUG ERROR in Department Stats:", error);
        res.status(500).json({ message: error.message });
    }
};