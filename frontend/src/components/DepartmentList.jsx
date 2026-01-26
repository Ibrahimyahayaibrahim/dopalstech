import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';
import {
  Building2,
  ArrowRight,
  Loader2,
  Lock,
  ArrowLeft,
  Globe,
  Users,
  LayoutGrid,
  Plus,
  Trash2,
  Search,
  ArrowUpDown,
} from 'lucide-react';
import AddDepartmentModal from './AddDepartmentModal';

const DepartmentList = ({ mode = 'MY' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // UI states
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('name-asc');

  // --- PERMISSIONS ---
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const isViewingAll = location.pathname.includes('/all') || mode === 'ALL';

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/departments?_nocache=${Date.now()}`);

      if (isViewingAll) {
        setDepartments(data);
      } else {
        const myDepts = data.filter((dept) =>
          user.departments?.some((userDept) => (userDept._id || userDept) === dept._id)
        );
        setDepartments(myDepts);
      }
    } catch (error) {
      console.error('Fetch error', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin && !isViewingAll) {
      navigate('/departments/all', { replace: true });
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isViewingAll, isSuperAdmin, navigate]);

  // --- DELETE FUNCTION ---
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) return;

    try {
      await API.delete(`/departments/${id}`);
      alert('Department deleted successfully.');
      fetchData();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to delete department.');
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...departments];

    if (q) {
      list = list.filter((d) => {
        const name = (d.name || '').toLowerCase();
        const desc = (d.description || '').toLowerCase();
        return name.includes(q) || desc.includes(q);
      });
    }

    const getPrograms = (d) => d.programs?.length || d.programCount || 0;
    const getStaff = (d) => d.staffCount || 0;

    list.sort((a, b) => {
      if (sort === 'name-asc') return (a.name || '').localeCompare(b.name || '');
      if (sort === 'name-desc') return (b.name || '').localeCompare(a.name || '');
      if (sort === 'staff-desc') return getStaff(b) - getStaff(a);
      if (sort === 'programs-desc') return getPrograms(b) - getPrograms(a);
      return 0;
    });

    return list;
  }, [departments, query, sort]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-emerald-700">
          <Loader2 className="animate-spin" size={22} />
          <span className="font-semibold">Loading departments…</span>
        </div>
      </div>
    );
  }

  const pageTitle = isViewingAll ? 'Organization Directory' : 'My Departments';
  const pageSubtitle = isViewingAll
    ? 'Explore all departments across the organization.'
    : 'Departments you are currently assigned to.';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky Glass Header */}
      <div className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/70 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-700 transition-colors font-semibold w-fit"
              >
                <ArrowLeft size={18} />
                Back to Dashboard
              </button>

              <div className="flex items-center gap-2">
                {isSuperAdmin && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition"
                  >
                    <Plus size={18} />
                    Create Dept
                  </button>
                )}

                <div className="flex gap-1 bg-white rounded-2xl border border-slate-200 p-1 shadow-sm">
                  {!isSuperAdmin && (
                    <button
                      onClick={() => navigate('/departments/my')}
                      className={`px-4 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-2 transition
                        ${
                          !isViewingAll
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                      <Users size={16} />
                      My Depts
                    </button>
                  )}

                  <button
                    onClick={() => navigate('/departments/all')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-2 transition
                      ${
                        isViewingAll
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-500 hover:bg-slate-50'
                      }`}
                  >
                    <Globe size={16} />
                    View All
                  </button>
                </div>
              </div>
            </div>

            {/* Title + Controls */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
                  {pageTitle}
                </h1>
                <p className="text-slate-500 text-sm md:text-base mt-1">{pageSubtitle}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                {/* Search */}
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600/60"
                    size={18}
                  />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search departments…"
                    className="w-full sm:w-80 rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                {/* Sort */}
                <div className="relative">
                  <ArrowUpDown
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600/60"
                    size={18}
                  />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="w-full sm:w-56 rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                  >
                    <option value="name-asc">Name (A → Z)</option>
                    <option value="name-desc">Name (Z → A)</option>
                    <option value="staff-desc">Most Staff</option>
                    <option value="programs-desc">Most Programs</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mini summary */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 border border-emerald-100">
                <Building2 size={14} />
                {filtered.length} shown
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
                <Users size={14} />
                {departments.length} total loaded
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((dept) => {
              const programs = dept.programs?.length || dept.programCount || 0;
              const staff = dept.staffCount || 0;

              return (
                <div
                  key={dept._id}
                  onClick={() => navigate(`/departments/${dept._id}`)}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md hover:border-emerald-200"
                >
                  {/* top accent (your dashboard vibe) */}
                  <div className="h-1 w-full bg-gradient-to-r from-emerald-900 via-emerald-700 to-emerald-500 opacity-80" />

                  {/* delete */}
                  {isSuperAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(dept._id, dept.name);
                      }}
                      className="absolute top-4 right-4 z-10 rounded-full border border-slate-200 bg-white/80 p-2 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition"
                      title="Delete Department"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}

                  <div className="p-6 flex flex-col justify-between min-h-[210px]">
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-2xl border border-emerald-100 bg-emerald-50 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
                            <Building2 size={22} />
                          </div>
                          <div className="text-xs text-slate-500">
                            <div className="font-semibold text-slate-700">Department</div>
                            <div className="text-slate-400">Click to open</div>
                          </div>
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-slate-900 pr-10 leading-snug">
                        {dept.name}
                      </h3>

                      <p className="mt-2 text-sm text-slate-500 line-clamp-2">
                        {dept.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          <LayoutGrid size={14} />
                          {programs} Programs
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          <Users size={14} />
                          {staff} Staff
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 group-hover:translate-x-1 transition-transform">
                        Details <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>

                  {/* hover glow (emerald) */}
                  <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition">
                    <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-emerald-200 blur-3xl opacity-40" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-100">
              <Lock size={28} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              {isViewingAll ? 'No Departments Found' : 'No Access Assigned'}
            </h3>
            <p className="text-slate-500 mt-2 max-w-lg mx-auto">
              {isViewingAll
                ? 'The organization structure is currently empty, or your search returned no matches.'
                : 'You are not assigned to any department yet.'}
            </p>

            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-2">
              <button
                onClick={() => {
                  setQuery('');
                  setSort('name-asc');
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Reset Filters
              </button>

              {isSuperAdmin && isViewingAll && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition"
                >
                  Create First Department
                </button>
              )}
            </div>
          </div>
        )}

        <AddDepartmentModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={fetchData}
        />
      </div>
    </div>
  );
};

export default DepartmentList;
