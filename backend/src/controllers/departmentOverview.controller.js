// backend/controllers/departmentOverview.controller.js
import mongoose from "mongoose";
import Department from "../models/Department.js";
import Program from "../models/Program.js";
import User from '../models/user.model.js';
import { KPI_DEFS } from "../config/kpis.js";

const parseRangeToDates = (range = "30d") => {
  const now = new Date();
  const match = String(range).match(/^(\d+)(d|w|m|y)$/i);
  if (!match) {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return { start, end: now };
  }
  const n = Number(match[1]);
  const unit = match[2].toLowerCase();
  const start = new Date(now);

  if (unit === "d") start.setDate(start.getDate() - n);
  if (unit === "w") start.setDate(start.getDate() - n * 7);
  if (unit === "m") start.setMonth(start.getMonth() - n);
  if (unit === "y") start.setFullYear(start.getFullYear() - n);

  return { start, end: now };
};

const safeDiv = (a, b) => (b && b !== 0 ? a / b : 0);

const scoreKpi = ({ actual, target, direction }) => {
  // returns 0..100
  if (target === undefined || target === null || target <= 0) return 0;
  if (direction === "down") {
    // lower is better
    if (!actual || actual <= 0) return 100;
    return Math.max(0, Math.min(100, (target / actual) * 100));
  }
  // up
  return Math.max(0, Math.min(100, (actual / target) * 100));
};

export const getDepartmentOverview = async (req, res) => {
  try {
    const { id } = req.params;
    const { range = "30d" } = req.query;
    const { start, end } = parseRangeToDates(range);

    const dept = await Department.findById(id).lean();
    if (!dept) return res.status(404).json({ message: "Department not found" });

    const deptId = new mongoose.Types.ObjectId(id);

    // ---- Staff stats ----
    // Adapt this to your user schema:
    // some users have departments: [ObjectId], some have department: ObjectId
    const staffTotal = await User.countDocuments({
      $or: [{ department: deptId }, { departments: deptId }],
    });

    const staffActive = await User.countDocuments({
      status: "Active",
      $or: [{ department: deptId }, { departments: deptId }],
    });

    // ---- Program aggregation for period ----
    const programsAgg = await Program.aggregate([
      {
        $match: {
          department: deptId,
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $facet: {
          counts: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ],
          totals: [
            {
              $group: {
                _id: null,
                programsTotal: { $sum: 1 },
                costTotal: { $sum: { $ifNull: ["$cost", 0] } },
                expectedTotal: { $sum: { $ifNull: ["$participantsCount", 0] } },
                actualTotal: { $sum: { $ifNull: ["$actualAttendance", 0] } },
                documentedCompleted: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ["$status", "Completed"] },
                          {
                            $or: [
                              { $ifNull: ["$finalDocument", false] },
                              { $ifNull: ["$driveLink", false] },
                            ],
                          },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                completedCount: {
                  $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
                },
                rejectedCount: {
                  $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] },
                },
                cancelledCount: {
                  $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] },
                },
                pendingCount: {
                  $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
                },
                // Approval lead time requires approvedAt to be present
                approvalLeadTimeSumDays: {
                  $sum: {
                    $cond: [
                      { $and: [{ $ifNull: ["$approvedAt", false] }, { $ifNull: ["$createdAt", false] }] },
                      {
                        $divide: [{ $subtract: ["$approvedAt", "$createdAt"] }, 1000 * 60 * 60 * 24],
                      },
                      0,
                    ],
                  },
                },
                approvalLeadTimeCount: {
                  $sum: {
                    $cond: [{ $ifNull: ["$approvedAt", false] }, 1, 0],
                  },
                },
              },
            },
          ],
          recentPrograms: [
            { $sort: { createdAt: -1 } },
            { $limit: 8 },
            {
              $project: {
                name: 1,
                status: 1,
                type: 1,
                date: 1,
                cost: 1,
                createdAt: 1,
                participantsCount: 1,
                actualAttendance: 1,
              },
            },
          ],
          statusTrendMonthly: [
            {
              $group: {
                _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" }, status: "$status" },
                count: { $sum: 1 },
              },
            },
            { $sort: { "_id.y": 1, "_id.m": 1 } },
          ],
        },
      },
    ]);

    const agg = programsAgg?.[0] || {};
    const totals = agg.totals?.[0] || {};
    const counts = agg.counts || [];

    const countsMap = counts.reduce((acc, c) => {
      acc[c._id] = c.count;
      return acc;
    }, {});

    const programsTotal = totals.programsTotal || 0;

    // ---- KPI actuals (computed) ----
    const programsDelivered = totals.completedCount || 0;
    const pendingBacklog = totals.pendingCount || 0;

    const completionDenom = (totals.completedCount || 0) + (totals.cancelledCount || 0) + (totals.rejectedCount || 0);
    const completionRate = safeDiv(totals.completedCount || 0, completionDenom);

    const documentationCompliance = safeDiv(totals.documentedCompleted || 0, totals.completedCount || 0);

    const reachRate = safeDiv(totals.actualTotal || 0, totals.expectedTotal || 0);

    const approvalLeadTimeDays = totals.approvalLeadTimeCount
      ? totals.approvalLeadTimeSumDays / totals.approvalLeadTimeCount
      : null;

    // ---- Build KPI targets (dept override -> default) ----
    const deptTargets = dept.kpiTargets || {};
    const deptWeights = dept.kpiWeights || {};

    const kpis = KPI_DEFS.map((def) => {
      const target = deptTargets?.[def.key] ?? def.targetDefault;
      const weight = deptWeights?.[def.key] ?? def.weight;

      const actualMap = {
        programs_delivered: programsDelivered,
        pending_backlog: pendingBacklog,
        completion_rate: completionRate,
        documentation_compliance: documentationCompliance,
        reach_rate: reachRate,
        approval_lead_time_days: approvalLeadTimeDays ?? 0, // if null treat as 0 for now
      };

      const actual = actualMap[def.key] ?? 0;

      const score = scoreKpi({ actual, target, direction: def.direction });

      return {
        ...def,
        target,
        weight,
        actual,
        score,
      };
    });

    // Overall KPI score (weighted)
    const weightSum = kpis.reduce((a, k) => a + (k.weight || 0), 0) || 1;
    const kpiScore = kpis.reduce((a, k) => a + (k.score * (k.weight || 0)), 0) / weightSum;

    // ---- Charts formatting ----
    const programsByStatus = Object.entries(countsMap).map(([status, count]) => ({
      status,
      count,
    }));

    // Monthly trend: convert grouped statusTrendMonthly to a series like:
    // [{ label: "2026-01", Pending: 2, Approved: 3, Completed: 1, ... }]
    const trendRaw = agg.statusTrendMonthly || [];
    const trendMap = new Map();
    for (const row of trendRaw) {
      const { y, m, status } = row._id;
      const key = `${y}-${String(m).padStart(2, "0")}`;
      if (!trendMap.has(key)) trendMap.set(key, { label: key });
      trendMap.get(key)[status] = row.count;
    }
    const programsTrend = Array.from(trendMap.values());

    res.json({
      department: {
        _id: dept._id,
        name: dept.name,
        description: dept.description,
        headOfDepartment: dept.headOfDepartment,
      },
      range: { start, end, range },
      counts: {
        staffTotal,
        staffActive,
        programsTotal,
        statusCounts: countsMap,
        costTotal: totals.costTotal || 0,
        expectedTotal: totals.expectedTotal || 0,
        actualTotal: totals.actualTotal || 0,
      },
      kpiScore,
      kpis,
      charts: {
        programsByStatus,
        programsTrend,
      },
      recent: {
        programs: agg.recentPrograms || [],
      },
    });
  } catch (err) {
    console.error("getDepartmentOverview error", err);
    res.status(500).json({ message: "Failed to load department overview" });
  }
};
