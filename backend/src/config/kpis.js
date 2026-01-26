// backend/config/kpis.js
export const KPI_DEFS = [
  {
    key: "programs_delivered",
    label: "Programs Delivered",
    unit: "count",
    direction: "up",
    weight: 18,
    targetDefault: 6,
    description: "Completed programs in the selected period.",
  },
  {
    key: "pending_backlog",
    label: "Pending Backlog",
    unit: "count",
    direction: "down",
    weight: 14,
    targetDefault: 2,
    description: "Programs still pending approval.",
  },
  {
    key: "completion_rate",
    label: "Completion Rate",
    unit: "%",
    direction: "up",
    weight: 18,
    targetDefault: 0.85,
    description: "Completed ÷ (Completed + Cancelled/Rejected in period).",
  },
  {
    key: "documentation_compliance",
    label: "Documentation Compliance",
    unit: "%",
    direction: "up",
    weight: 16,
    targetDefault: 0.8,
    description: "Completed programs with final report or drive link.",
  },
  {
    key: "reach_rate",
    label: "Reach Rate",
    unit: "%",
    direction: "up",
    weight: 18,
    targetDefault: 0.75,
    description: "Actual attendance ÷ expected participants.",
  },
  {
    key: "approval_lead_time_days",
    label: "Approval Lead Time",
    unit: "days",
    direction: "down",
    weight: 16,
    targetDefault: 3,
    description: "Avg days from created → approved.",
  },
];

// Optional: helper to compute overall score weight sum (should be 100)
export const KPI_WEIGHT_SUM = KPI_DEFS.reduce((a, k) => a + (k.weight || 0), 0);
