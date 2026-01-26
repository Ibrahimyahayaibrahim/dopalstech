import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import {
  ArrowLeft,
  Building2,
  TrendingUp,
  Users,
  Layers,
  Search,
  Filter,
  Calendar,
  ChevronDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

// ---------------- Skeleton ----------------
const SkeletonBlock = ({ className = "" }) => (
  <div className={`animate-pulse bg-slate-200/70 rounded-xl ${className}`} />
);

const DepartmentOverviewSkeleton = () => (
  <div className="min-h-screen bg-slate-50 px-4 md:px-8 py-6 pb-24">
    <SkeletonBlock className="h-10 w-40 mb-6" />

    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-3 flex-1">
          <SkeletonBlock className="h-8 w-2/3" />
          <SkeletonBlock className="h-4 w-full md:w-3/4" />
          <SkeletonBlock className="h-4 w-1/2" />
        </div>
        <SkeletonBlock className="h-20 w-full md:w-56" />
      </div>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4">
          <SkeletonBlock className="h-3 w-20 mb-3" />
          <SkeletonBlock className="h-8 w-16" />
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-6">
        <SkeletonBlock className="h-5 w-44 mb-4" />
        <SkeletonBlock className="h-64 w-full" />
      </div>
      <div className="bg-white border border-slate-200 rounded-3xl p-6">
        <SkeletonBlock className="h-5 w-44 mb-4" />
        <SkeletonBlock className="h-64 w-full" />
      </div>
    </div>

    <div className="bg-white border border-slate-200 rounded-3xl p-6 mt-6">
      <SkeletonBlock className="h-5 w-44 mb-4" />
      <SkeletonBlock className="h-12 w-full mb-3" />
      <SkeletonBlock className="h-12 w-full mb-3" />
      <SkeletonBlock className="h-12 w-full" />
    </div>
  </div>
);

// ---------------- Utils ----------------
const formatPct = (v) => `${Math.round((v || 0) * 100)}%`;

const kpiBadge = (score) => {
  if (score >= 90) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (score >= 75) return "bg-blue-50 text-blue-700 border-blue-200";
  if (score >= 60) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-700 border-red-200";
};

const StatCard = ({ icon, label, value, hint }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl md:text-2xl font-black text-slate-900 mt-1 break-words">{value}</p>
        {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
      </div>
      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
        {icon}
      </div>
    </div>
  </div>
);

const DepartmentOverview = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);

  // UI state
  const [range, setRange] = useState("30d");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/departments/${id}/overview?range=${range}`);
      setOverview(data);
    } catch (e) {
      console.error(e);
      setOverview(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, range]);

  const recentPrograms = useMemo(() => {
    const list = overview?.recent?.programs || [];
    const term = search.trim().toLowerCase();
    return list.filter((p) => {
      const okSearch = !term || (p.name || "").toLowerCase().includes(term);
      const okStatus = statusFilter === "All" || p.status === statusFilter;
      return okSearch && okStatus;
    });
  }, [overview, search, statusFilter]);

  if (loading) return <DepartmentOverviewSkeleton />;

  if (!overview) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 md:px-8 py-10">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-slate-600 font-bold">
          <ArrowLeft size={18} /> Back
        </button>
        <div className="mt-8 bg-white border border-slate-200 rounded-3xl p-8 text-center">
          <p className="font-black text-slate-800">Couldn’t load department overview.</p>
          <button
            onClick={fetchOverview}
            className="mt-4 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const dept = overview.department;
  const counts = overview.counts || {};
  const kpis = overview.kpis || [];
  const score = overview.kpiScore || 0;

  // pick top 3 KPIs to highlight
  const topKpis = [...kpis].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50 px-4 md:px-8 py-6 pb-24">
      {/* Top nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-emerald-700 transition-colors font-bold w-fit"
        >
          <ArrowLeft size={18} /> Back
        </button>

        {/* Range picker */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar className="absolute left-3 top-3 text-slate-400" size={16} />
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none hover:bg-slate-50 appearance-none"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="180d">Last 6 months</option>
              <option value="1y">Last 1 year</option>
            </select>
            <ChevronDown className="absolute right-3 top-3 text-slate-400" size={16} />
          </div>
        </div>
      </div>

      {/* Header card */}
      <div className="relative overflow-hidden bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm mb-6">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-900 via-emerald-600 to-emerald-400 opacity-80" />

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                <Building2 size={22} />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 break-words">{dept?.name}</h1>
                <p className="text-slate-500 text-sm mt-1">{dept?.description || "No description."}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-black ${kpiBadge(score)}`}>
                <TrendingUp size={14} /> KPI Score: {Math.round(score)}
              </span>
              {topKpis.map((k) => (
                <span
                  key={k.key}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-slate-50 text-slate-700 border-slate-200 text-xs font-bold"
                  title={k.description}
                >
                  {k.label}:{" "}
                  <span className="font-black">
                    {k.unit === "%" ? formatPct(k.actual) : Math.round(k.actual || 0)}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-auto grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Staff</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{counts.staffTotal || 0}</p>
              <p className="text-[11px] text-slate-500 mt-1">{counts.staffActive || 0} active</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Programs</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{counts.programsTotal || 0}</p>
              <p className="text-[11px] text-slate-500 mt-1">{counts.statusCounts?.Pending || 0} pending</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 col-span-2 sm:col-span-1">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Reach</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{counts.actualTotal || 0}</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Expected {counts.expectedTotal || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-emerald-200 blur-3xl opacity-25" />
      </div>

      {/* KPI cards (responsive grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
        <StatCard icon={<Users size={18} />} label="Total Staff" value={counts.staffTotal || 0} />
        <StatCard icon={<Users size={18} />} label="Active Staff" value={counts.staffActive || 0} />
        <StatCard icon={<Layers size={18} />} label="Total Programs" value={counts.programsTotal || 0} />
        <StatCard icon={<Filter size={18} />} label="Pending" value={counts.statusCounts?.Pending || 0} />
        <StatCard icon={<TrendingUp size={18} />} label="KPI Score" value={Math.round(score)} hint="0–100" />
        <StatCard icon={<TrendingUp size={18} />} label="Total Reach" value={counts.actualTotal || 0} hint="attendance" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Programs by Status */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="font-black text-slate-900">Programs by Status</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview.charts?.programsByStatus || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="status" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <RechartsTooltip />
                <Bar dataKey="count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="font-black text-slate-900">Programs Trend</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={overview.charts?.programsTrend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <RechartsTooltip />
                {/* draw a couple key statuses if present */}
                <Line type="monotone" dataKey="Pending" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="Approved" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="Completed" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            Tip: the lines show only statuses that exist in the current range.
          </p>
        </div>
      </div>

      {/* Recent programs (filters + search) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mt-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <p className="font-black text-slate-900">Recent Programs</p>
            <p className="text-sm text-slate-500">Quick view with search + status filter (does not affect analytics)</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-3 text-slate-400" size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search program name..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-sm"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-3 text-slate-400" size={16} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 outline-none appearance-none w-full sm:w-48"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <ChevronDown className="absolute right-3 top-3 text-slate-400" size={16} />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="p-4">Program</th>
                <th className="p-4">Status</th>
                <th className="p-4">Expected</th>
                <th className="p-4">Actual</th>
                <th className="p-4">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentPrograms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No recent programs match your filter.
                  </td>
                </tr>
              ) : (
                recentPrograms.map((p) => (
                  <tr
                    key={p._id}
                    className="hover:bg-emerald-50/40 cursor-pointer"
                    onClick={() => navigate(`/programs/${p._id}`)}
                  >
                    <td className="p-4">
                      <p className="font-black text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{p.type || "Program"}</p>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex px-2.5 py-1 rounded-full border text-[10px] font-black bg-slate-50 border-slate-200 text-slate-700">
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-700">{p.participantsCount || 0}</td>
                    <td className="p-4 font-bold text-slate-700">{p.actualAttendance || 0}</td>
                    <td className="p-4 font-bold text-slate-700">₦{(p.cost || 0).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DepartmentOverview;
