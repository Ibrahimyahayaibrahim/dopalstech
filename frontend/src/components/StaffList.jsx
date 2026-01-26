import { useState, useEffect, useRef, useMemo } from 'react';
import API from '../services/api';
import {
  Trash2,
  Ban,
  CheckCircle,
  Search,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ShieldAlert,
  MoreVertical,
  UserX,
  UserCheck,
  Building2,
  Mail,
  User,
} from 'lucide-react';
import StaffIdCardModal from './StaffIdCardModal';

const StaffList = ({ searchQuery, currentUser }) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);

  // Filters
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departments, setDepartments] = useState(['All']);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mobile per-row menu
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRefs = useRef({});

  // ---------------- Helpers ----------------
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    if (path.startsWith('blob:')) return path;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `http://localhost:5000${normalized}`;
  };

  const roleLabel = (role) => (role || 'STAFF').toString().replaceAll('_', ' ');
  const statusColor = (status) => {
    if (status === 'Active') return 'bg-green-50 text-green-700 border-green-200';
    if (status === 'Pending') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const canManageUser = (targetUser) => {
    if (!currentUser || !targetUser) return false;
    if (currentUser.role === 'STAFF') return false;
    if (currentUser.role === 'SUPER_ADMIN') return true;

    if (currentUser.role === 'ADMIN') {
      if (targetUser.role !== 'STAFF') return false;
      const myDepts = currentUser.departments?.map((d) => (d._id || d).toString()) || [];
      const targetDepts = targetUser.departments?.map((d) => (d._id || d).toString()) || [];
      return myDepts.some((id) => targetDepts.includes(id));
    }
    return false;
  };

  // ---------------- Fetch ----------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data } = await API.get('/users');
        const staffArray = Array.isArray(data) ? data : data.users || [];
        setStaff(staffArray);

        const allDeptNames = staffArray.flatMap((u) => u.departments?.map((d) => d?.name) || []);
        const uniqueDepts = ['All', ...new Set(allDeptNames.filter(Boolean))];
        setDepartments(uniqueDepts);
      } catch (err) {
        console.error('Failed to fetch staff:', err);
        setError('Failed to load staff list.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Close menu on outside click (works per-row)
  useEffect(() => {
    const handleClickOutside = (event) => {
      const activeRef = activeMenuId ? menuRefs.current[activeMenuId] : null;
      if (activeMenuId && activeRef && !activeRef.contains(event.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);

  // ---------------- Filtering ----------------
  const filteredStaff = useMemo(() => {
    let result = staff || [];

    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          (u.name && u.name.toLowerCase().includes(term)) ||
          (u.email && u.email.toLowerCase().includes(term))
      );
    }

    if (deptFilter !== 'All') {
      result = result.filter((u) => u.departments?.some((d) => d?.name === deptFilter));
    }

    if (statusFilter !== 'All') {
      result = result.filter((u) => u.status === statusFilter);
    }

    return result;
  }, [staff, searchQuery, deptFilter, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [deptFilter, statusFilter, searchQuery]);

  // ---------------- Pagination ----------------
  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStaff.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  // ---------------- Actions ----------------
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    setActiveMenuId(null);
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await API.delete(`/users/${id}`);
        setStaff((prev) => prev.filter((u) => u._id !== id));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleToggleStatus = async (id, e) => {
    e.stopPropagation();
    setActiveMenuId(null);
    try {
      const { data } = await API.put(`/users/${id}/status`);
      setStaff((prev) => prev.map((u) => (u._id === id ? { ...u, status: data.status } : u)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const toggleMenu = (id, e) => {
    e.stopPropagation();
    setActiveMenuId((prev) => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-emerald-600" />
      </div>
    );
  }
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <>
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[520px]">
        {/* FILTER BAR */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col md:flex-row gap-3 md:gap-4 md:items-center md:justify-between bg-white/70 backdrop-blur sticky top-0 z-20">
          <div className="flex items-center justify-between md:justify-start gap-3">
            <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider pl-1">
              {filteredStaff.length} Members
            </span>

            {/* small search hint (optional) */}
            {searchQuery ? (
              <span className="hidden sm:inline-flex items-center gap-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
                <Search size={12} /> Filtered
              </span>
            ) : null}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Filter size={14} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full md:w-auto pl-9 pr-8 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-extrabold text-gray-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 cursor-pointer transition-all appearance-none"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex-1 md:flex-none">
              <ShieldAlert
                size={14}
                className="absolute left-3 top-3 text-gray-400 pointer-events-none"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full md:w-auto pl-9 pr-8 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-extrabold text-gray-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 cursor-pointer transition-all appearance-none"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* ✅ MOBILE: CARDS (no overlap issues) */}
        <div className="md:hidden p-4 space-y-3 bg-gray-50/40 flex-1">
          {currentItems.length ? (
            currentItems.map((user) => {
              const manageable = canManageUser(user);

              return (
                <div
                  key={user._id}
                  onClick={() => setSelectedUser(user)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 active:scale-[0.99] transition cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-extrabold text-lg overflow-hidden border border-white shadow-sm">
                        {user.profilePicture ? (
                          <img
                            src={getImageUrl(user.profilePicture)}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        ) : (
                          (user.name || '?').charAt(0)
                        )}
                      </div>
                      <div
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white rounded-full ${
                          user.status === 'Active'
                            ? 'bg-green-500'
                            : user.status === 'Pending'
                            ? 'bg-amber-400'
                            : 'bg-red-500'
                        }`}
                      />
                    </div>

                    {/* Main */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-extrabold text-gray-900 text-sm truncate">
                            {user.name || 'Unknown'}
                          </p>
                          <p className="text-[12px] text-gray-500 font-semibold truncate flex items-center gap-1">
                            <Mail size={14} className="text-gray-400 shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </p>
                        </div>

                        {/* Status */}
                        <span
                          className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-extrabold border uppercase tracking-wider ${statusColor(
                            user.status
                          )}`}
                        >
                          {user.status === 'Pending' && <Clock size={10} strokeWidth={3} />}
                          {user.status === 'Suspended' && <Ban size={10} strokeWidth={3} />}
                          {user.status === 'Active' && <CheckCircle size={10} strokeWidth={3} />}
                          {user.status || 'Unknown'}
                        </span>
                      </div>

                      {/* Role + Position */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-lg uppercase font-extrabold border border-slate-200 tracking-wider">
                          {roleLabel(user.role)}
                        </span>

                        <span className="text-[10px] bg-gray-50 text-gray-600 px-2 py-1 rounded-lg font-bold border border-gray-200">
                          {user.position || 'Staff Member'}
                        </span>
                      </div>

                      {/* Departments (safe wrap) */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(user.departments || []).slice(0, 3).map((d, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg font-bold max-w-[160px] truncate"
                          >
                            {d?.name}
                          </span>
                        ))}
                        {(user.departments || []).length > 3 ? (
                          <span className="text-[10px] text-gray-500 bg-gray-100 border border-gray-200 px-2 py-1 rounded-lg font-bold">
                            +{(user.departments || []).length - 3}
                          </span>
                        ) : null}
                      </div>

                      {/* Actions */}
                      {manageable && (
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={(e) => handleToggleStatus(user._id, e)}
                            className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-extrabold transition ${
                              user.status === 'Active'
                                ? 'bg-white border-amber-200 text-amber-700 hover:bg-amber-50'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {user.status === 'Active' ? <UserX size={16} /> : <UserCheck size={16} />}
                            {user.status === 'Active' ? 'Suspend' : 'Activate'}
                          </button>

                          {currentUser?.role === 'SUPER_ADMIN' && (
                            <button
                              onClick={(e) => handleDelete(user._id, e)}
                              className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2 hover:bg-red-100 transition"
                              title="Delete User"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState />
          )}
        </div>

        {/* ✅ DESKTOP: TABLE */}
        <div className="hidden md:block w-full overflow-x-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse min-w-[820px]">
            <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400 font-extrabold uppercase text-[10px] tracking-[0.25em] sticky top-0 z-10">
              <tr>
                <th className="p-6">Employee</th>
                <th className="p-6">Role & Dept</th>
                <th className="p-6">Status</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {currentItems.length ? (
                currentItems.map((user) => (
                  <tr
                    key={user._id}
                    onClick={() => setSelectedUser(user)}
                    className="hover:bg-emerald-50/40 transition-colors cursor-pointer group"
                  >
                    {/* EMPLOYEE */}
                    <td className="p-6">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="relative shrink-0">
                          <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-extrabold text-lg overflow-hidden border-2 border-white shadow-sm">
                            {user.profilePicture ? (
                              <img
                                src={getImageUrl(user.profilePicture)}
                                className="w-full h-full object-cover"
                                alt=""
                              />
                            ) : (
                              (user.name || '?').charAt(0)
                            )}
                          </div>
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white rounded-full ${
                              user.status === 'Active'
                                ? 'bg-green-500'
                                : user.status === 'Pending'
                                ? 'bg-amber-400'
                                : 'bg-red-500'
                            }`}
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="font-extrabold text-gray-900 text-sm truncate">
                            {user.name || 'Unknown'}
                          </p>
                          <p className="text-[11px] text-gray-500 font-semibold truncate max-w-[260px]">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* ROLE & DEPT */}
                    <td className="p-6">
                      <p className="font-bold text-xs text-gray-800 mb-1 line-clamp-1">
                        {user.position || 'Staff Member'}
                      </p>

                      <div className="flex flex-wrap gap-1.5 max-w-[520px]">
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md uppercase font-extrabold border border-slate-200 tracking-wider">
                          {roleLabel(user.role)}
                        </span>

                        {(user.departments || []).slice(0, 4).map((d, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md font-bold max-w-[160px] truncate"
                            title={d?.name}
                          >
                            {d?.name}
                          </span>
                        ))}

                        {(user.departments || []).length > 4 ? (
                          <span className="text-[9px] text-gray-600 bg-gray-100 border border-gray-200 px-2 py-1 rounded-md font-bold">
                            +{(user.departments || []).length - 4}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="p-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold border uppercase tracking-wider ${statusColor(
                          user.status
                        )}`}
                      >
                        {user.status === 'Pending' && <Clock size={10} strokeWidth={3} />}
                        {user.status === 'Suspended' && <Ban size={10} strokeWidth={3} />}
                        {user.status === 'Active' && <CheckCircle size={10} strokeWidth={3} />}
                        {user.status || 'Unknown'}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="p-6 text-right relative">
                      {canManageUser(user) && (
                        <div className="flex items-center justify-end gap-2">
                          {/* Desktop buttons */}
                          <div className="hidden lg:flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                            <button
                              onClick={(e) => handleToggleStatus(user._id, e)}
                              className={`p-2 rounded-xl transition-all shadow-sm border ${
                                user.status === 'Active'
                                  ? 'bg-white border-amber-200 text-amber-700 hover:bg-amber-50'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                              }`}
                              title={user.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
                            >
                              {user.status === 'Active' ? (
                                <UserX size={16} />
                              ) : (
                                <UserCheck size={16} />
                              )}
                            </button>

                            {currentUser?.role === 'SUPER_ADMIN' && (
                              <button
                                onClick={(e) => handleDelete(user._id, e)}
                                className="p-2 bg-white border border-red-200 text-red-700 rounded-xl hover:bg-red-50 transition-all shadow-sm"
                                title="Delete User"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>

                          {/* Tablet menu (so no overlap) */}
                          <div className="lg:hidden flex justify-end">
                            <button
                              onClick={(e) => toggleMenu(user._id, e)}
                              className={`p-2 rounded-xl transition-colors ${
                                activeMenuId === user._id
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'text-gray-500 hover:bg-gray-100'
                              }`}
                            >
                              <MoreVertical size={18} />
                            </button>

                            {activeMenuId === user._id && (
                              <div
                                ref={(el) => (menuRefs.current[user._id] = el)}
                                className="absolute right-6 top-14 z-50 bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-gray-100 p-2 flex flex-col gap-1 min-w-[170px] animate-in fade-in zoom-in-95 duration-200 origin-top-right"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="px-3 py-2 border-b border-gray-100 mb-1">
                                  <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                                    Manage Access
                                  </p>
                                </div>

                                <button
                                  onClick={(e) => handleToggleStatus(user._id, e)}
                                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-extrabold transition-colors ${
                                    user.status === 'Active'
                                      ? 'text-amber-700 hover:bg-amber-50'
                                      : 'text-emerald-700 hover:bg-emerald-50'
                                  }`}
                                >
                                  {user.status === 'Active' ? (
                                    <UserX size={14} />
                                  ) : (
                                    <UserCheck size={14} />
                                  )}
                                  {user.status === 'Active' ? 'Suspend User' : 'Activate User'}
                                </button>

                                {currentUser?.role === 'SUPER_ADMIN' && (
                                  <button
                                    onClick={(e) => handleDelete(user._id, e)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-extrabold text-red-700 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 size={14} /> Delete Account
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-20">
                    <EmptyState />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {filteredStaff.length > itemsPerPage && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-4 py-2 text-xs font-extrabold bg-white border border-gray-200 rounded-xl text-gray-700 hover:border-emerald-500 hover:text-emerald-700 disabled:opacity-50 shadow-sm transition-all active:scale-95 disabled:active:scale-100"
            >
              <ChevronLeft size={16} /> Prev
            </button> 

            <span className="text-xs font-extrabold text-gray-500 bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm">
              Page {currentPage} of {totalPages}
            </span>

            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-4 py-2 text-xs font-extrabold bg-white border border-gray-200 rounded-xl text-gray-700 hover:border-emerald-500 hover:text-emerald-700 disabled:opacity-50 shadow-sm transition-all active:scale-95 disabled:active:scale-100"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {selectedUser && <StaffIdCardModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
    </>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center gap-4 text-center text-gray-400">
    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
      <User size={24} className="opacity-20" />
    </div>
    <div>
      <p className="text-sm font-extrabold text-gray-600">No staff members found.</p>
      <p className="text-xs mt-1">Try adjusting your search or filters.</p>
    </div>
  </div>
);

export default StaffList;
