import { useEffect, useMemo, useState } from 'react';
import API from '../services/api';
import {
  Check,
  X,
  Clock,
  FileText,
  DollarSign,
  Calendar,
  Users,
  Edit3,
  Layers,
  Hash,
  Filter,
  Search,
  RotateCcw,
  Building2,
  User as UserIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import ManageParticipantsModal from './ManageParticipantsModal';
import EditProgramModal from './EditProgramModal';

const ProgramRequests = ({ searchQuery = '' }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF';

  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedProgramForParticipants, setSelectedProgramForParticipants] = useState(null);
  const [editingProgram, setEditingProgram] = useState(null);

  // ---- Filters (GOOD ONES) ----
  const [q, setQ] = useState(searchQuery || '');
  const [status, setStatus] = useState('All'); // All | Pending | Approved | Ongoing | Completed | Rejected
  const [type, setType] = useState('All'); // All | Standard | Master | Version
  const [dept, setDept] = useState('All');
  const [onlyMine, setOnlyMine] = useState(false);
  const [needsAction, setNeedsAction] = useState(false); // only relevant for admins
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Keep q synced with incoming searchQuery
  useEffect(() => setQ(searchQuery || ''), [searchQuery]);

  const myDeptIds = useMemo(() => {
    if (isSuperAdmin) return [];
    const depts = [];
    if (Array.isArray(user?.departments)) depts.push(...user.departments);
    if (user?.department) depts.push(user.department);
    return depts.map((d) => (d?._id || d)?.toString()).filter(Boolean);
  }, [user, isSuperAdmin]);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/programs');
      setPrograms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch programs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBD';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date TBD';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getDeptName = (p) => p?.department?.name || 'General';
  const getDeptId = (p) => (p?.department?._id || p?.department)?.toString();

  const getTypeInfo = (p) => {
    const isMaster = !p?.parentProgram && (p?.structure === 'Recurring' || p?.structure === 'Numerical');
    const isVersion = !!p?.parentProgram;
    if (isMaster) return { label: 'Master', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Layers };
    if (isVersion) return { label: 'Version', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Hash };
    return { label: 'Standard', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: FileText };
  };

  const canUserEdit = (program) => {
    if (isSuperAdmin) return true;
    const pDeptId = getDeptId(program);

    if (isAdmin && myDeptIds.includes(pDeptId)) return true;
    if (isStaff && program?.createdBy?._id === user?._id && myDeptIds.includes(pDeptId)) return true;

    return false;
  };

  const canActOnPending = (program) => {
    if (!program || program.status !== 'Pending') return false;
    if (isSuperAdmin) return true;
    if (isAdmin) return myDeptIds.includes(getDeptId(program));
    return false;
  };

  const canManageParticipants = (program) => {
    const typeInfo = getTypeInfo(program);
    if (typeInfo.label === 'Master') return false; // don’t manage participants on master
    if (!['Approved', 'Ongoing', 'Completed'].includes(program?.status)) return false;
    return isSuperAdmin || canUserEdit(program);
  };

  const handleStatusUpdate = async (e, id, newStatus) => {
    e.stopPropagation();
    const action = newStatus === 'Approved' ? 'approve' : 'reject';
    if (!window.confirm(`Are you sure you want to ${action} this program?`)) return;

    try {
      // optimistic
      setPrograms((prev) => prev.map((p) => (p._id === id ? { ...p, status: newStatus } : p)));
      await API.put(`/programs/${id}/status`, { status: newStatus });
    } catch (err) {
      alert('Failed to update status.');
      fetchPrograms();
    }
  };

  const handleEditClick = (e, program) => {
    e.stopPropagation();
    setEditingProgram(program);
  };

  // --- Filter options (dynamic) ---
  const deptOptions = useMemo(() => {
    const names = programs.map(getDeptName).filter(Boolean);
    return ['All', ...Array.from(new Set(names))];
  }, [programs]);

  const typeOptions = ['All', 'Standard', 'Master', 'Version'];
  const statusOptions = ['All', 'Pending', 'Approved', 'Ongoing', 'Completed', 'Rejected'];

  // --- Core search + filters ---
  const filtered = useMemo(() => {
    const term = (q || '').trim().toLowerCase();

    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;
    if (to) to.setHours(23, 59, 59, 999);

    return (programs || [])
      .filter((p) => {
        // Search
        if (term) {
          const hay = [
            p?.name,
            p?.type,
            p?.description,
            p?.createdBy?.name,
            p?.department?.name,
            p?.customSuffix,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          if (!hay.includes(term)) return false;
        }

        // Status filter
        if (status !== 'All' && p?.status !== status) return false;

        // Type filter (Master/Version/Standard)
        const t = getTypeInfo(p).label;
        if (type !== 'All' && t !== type) return false;

        // Department filter
        if (dept !== 'All' && getDeptName(p) !== dept) return false;

        // Only mine
        if (onlyMine && p?.createdBy?._id !== user?._id) return false;

        // Needs action
        if (needsAction && !canActOnPending(p)) return false;

        // Date range (skip master because no date matters; but still allow filtering if it has date)
        if ((from || to) && p?.date) {
          const d = new Date(p.date);
          if (from && d < from) return false;
          if (to && d > to) return false;
        } else if ((from || to) && !p?.date) {
          // if you set date filters, hide items with no date
          return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
  }, [programs, q, status, type, dept, onlyMine, needsAction, dateFrom, dateTo, user?._id]);

  // --- Buckets ---
  const actionRequired = useMemo(() => filtered.filter((p) => canActOnPending(p)), [filtered]);
  const myPending = useMemo(() => {
    if (!isStaff) return [];
    return filtered.filter((p) => p?.status === 'Pending' && p?.createdBy?._id === user?._id);
  }, [filtered, isStaff, user?._id]);

  // All list excludes sections so you don’t see duplicates
  const globalList = useMemo(() => {
    const ids = new Set([...actionRequired, ...myPending].map((x) => x._id));
    return filtered.filter((p) => !ids.has(p._id));
  }, [filtered, actionRequired, myPending]);

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (status !== 'All') c++;
    if (type !== 'All') c++;
    if (dept !== 'All') c++;
    if (onlyMine) c++;
    if (needsAction) c++;
    if (dateFrom) c++;
    if (dateTo) c++;
    if ((q || '').trim()) c++;
    return c;
  }, [status, type, dept, onlyMine, needsAction, dateFrom, dateTo, q]);

  const clearFilters = () => {
    setQ(searchQuery || '');
    setStatus('All');
    setType('All');
    setDept('All');
    setOnlyMine(false);
    setNeedsAction(false);
    setDateFrom('');
    setDateTo('');
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-400 font-bold animate-pulse">
        Loading Requests...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-enter pb-10">
      {/* HEADER + FILTERS */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 md:p-6 border-b border-gray-100 bg-white/70 backdrop-blur">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                <Filter className="text-emerald-600" />
                Program Requests
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Review, approve, track status, and manage participants — with clean filters.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatPill label="Action Required" value={actionRequired.length} color="amber" />
              {isStaff && <StatPill label="Awaiting Approval" value={myPending.length} color="blue" />}
              <StatPill label="All" value={filtered.length} color="slate" />
            </div>
          </div>

          {/* Filter Controls */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-3">
            {/* Search */}
            <div className="xl:col-span-4 relative">
              <Search size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search programs, requester, department..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm font-semibold text-gray-800"
              />
            </div>

            {/* Status */}
            <div className="xl:col-span-2">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm font-bold text-gray-700"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    Status: {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div className="xl:col-span-2">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm font-bold text-gray-700"
              >
                {typeOptions.map((t) => (
                  <option key={t} value={t}>
                    Type: {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div className="xl:col-span-2">
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm font-bold text-gray-700"
              >
                {deptOptions.map((d) => (
                  <option key={d} value={d}>
                    Dept: {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div className="xl:col-span-1">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm font-bold text-gray-700"
                title="From"
              />
            </div>

            {/* Date To */}
            <div className="xl:col-span-1">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm font-bold text-gray-700"
                title="To"
              />
            </div>

            {/* Toggles */}
            <div className="xl:col-span-12 flex flex-wrap items-center justify-between gap-3 mt-1">
              <div className="flex flex-wrap gap-2">
                <TogglePill
                  enabled={onlyMine}
                  onClick={() => setOnlyMine((v) => !v)}
                  icon={UserIcon}
                  label="Only mine"
                />
                {(isSuperAdmin || isAdmin) && (
                  <TogglePill
                    enabled={needsAction}
                    onClick={() => setNeedsAction((v) => !v)}
                    icon={Clock}
                    label="Needs action"
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <span className="text-[11px] font-extrabold text-gray-400">
                    {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                  </span>
                )}
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-extrabold text-gray-700 transition"
                >
                  <RotateCcw size={14} /> Clear
                </button>
              </div>
            </div>

            {/* Active filter chips */}
            <div className="xl:col-span-12 flex flex-wrap gap-2 mt-1">
              {q?.trim() ? <Chip label={`Search: ${q.trim()}`} onRemove={() => setQ('')} /> : null}
              {status !== 'All' ? <Chip label={`Status: ${status}`} onRemove={() => setStatus('All')} /> : null}
              {type !== 'All' ? <Chip label={`Type: ${type}`} onRemove={() => setType('All')} /> : null}
              {dept !== 'All' ? <Chip label={`Dept: ${dept}`} onRemove={() => setDept('All')} /> : null}
              {dateFrom ? <Chip label={`From: ${dateFrom}`} onRemove={() => setDateFrom('')} /> : null}
              {dateTo ? <Chip label={`To: ${dateTo}`} onRemove={() => setDateTo('')} /> : null}
              {onlyMine ? <Chip label="Only mine" onRemove={() => setOnlyMine(false)} /> : null}
              {needsAction ? <Chip label="Needs action" onRemove={() => setNeedsAction(false)} /> : null}
            </div>
          </div>
        </div>

        {/* MOBILE LIST */}
        <div className="md:hidden p-4 bg-gray-50/40 space-y-3">
          {actionRequired.length > 0 && (
            <SectionTitle icon={Clock} color="amber" title="Action Required" count={actionRequired.length} />
          )}
          {actionRequired.map((p) => (
            <ProgramCard
              key={p._id}
              program={p}
              onClick={() => navigate(`/programs/${p._id}`)}
              onAction={handleStatusUpdate}
              onEdit={handleEditClick}
              formatDate={formatDate}
              canAct={canActOnPending(p)}
              canEdit={canUserEdit(p)}
              typeInfo={getTypeInfo(p)}
            />
          ))}

          {isStaff && myPending.length > 0 && (
            <SectionTitle icon={Clock} color="blue" title="Awaiting Approval" count={myPending.length} />
          )}
          {myPending.map((p) => (
            <ProgramCard
              key={p._id}
              program={p}
              onClick={() => navigate(`/programs/${p._id}`)}
              onEdit={handleEditClick}
              formatDate={formatDate}
              canAct={false}
              isOwner
              canEdit
              typeInfo={getTypeInfo(p)}
            />
          ))}

          <SectionTitle icon={FileText} color="slate" title="All Programs" count={globalList.length} />
          {globalList.map((p) => (
            <ProgramCard
              key={p._id}
              program={p}
              onClick={() => navigate(`/programs/${p._id}`)}
              onEdit={handleEditClick}
              formatDate={formatDate}
              canAct={canActOnPending(p)}
              canEdit={canUserEdit(p)}
              typeInfo={getTypeInfo(p)}
              onManageParticipants={
                canManageParticipants(p)
                  ? (e) => {
                      e.stopPropagation();
                      setSelectedProgramForParticipants(p);
                    }
                  : null
              }
            />
          ))}

          {filtered.length === 0 && <EmptyState />}
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden md:block">
          <div className="px-6 pt-5">
            {actionRequired.length > 0 && (
              <SectionTitle icon={Clock} color="amber" title="Action Required" count={actionRequired.length} />
            )}
          </div>

          {actionRequired.length > 0 && (
            <div className="px-6 pb-6 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {actionRequired.map((p) => (
                <ProgramCard
                  key={p._id}
                  program={p}
                  onClick={() => navigate(`/programs/${p._id}`)}
                  onAction={handleStatusUpdate}
                  onEdit={handleEditClick}
                  formatDate={formatDate}
                  canAct
                  canEdit={canUserEdit(p)}
                  typeInfo={getTypeInfo(p)}
                />
              ))}
            </div>
          )}

          {isStaff && myPending.length > 0 && (
            <div className="px-6 pb-6">
              <SectionTitle icon={Clock} color="blue" title="Awaiting Approval" count={myPending.length} />
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
                {myPending.map((p) => (
                  <ProgramCard
                    key={p._id}
                    program={p}
                    onClick={() => navigate(`/programs/${p._id}`)}
                    onEdit={handleEditClick}
                    formatDate={formatDate}
                    isOwner
                    canEdit
                    typeInfo={getTypeInfo(p)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="px-6 pb-5">
            <SectionTitle icon={FileText} color="slate" title="All Programs" count={globalList.length} />
          </div>

          <div className="overflow-x-auto pb-4">
            <table className="w-full text-left text-sm min-w-[880px]">
              <thead className="bg-gray-50 text-gray-400 font-extrabold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="p-4">Program</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Requester</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50 bg-white">
                {globalList.map((p) => {
                  const typeInfo = getTypeInfo(p);
                  return (
                    <tr
                      key={p._id}
                      onClick={() => navigate(`/programs/${p._id}`)}
                      className="hover:bg-gray-50/60 cursor-pointer transition-colors group"
                    >
                      <td className="p-4 font-extrabold text-gray-800">{p.name}</td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-extrabold border uppercase ${typeInfo.color}`}
                        >
                          <typeInfo.icon size={12} />
                          {typeInfo.label}
                        </span>
                      </td>

                      <td className="p-4 text-gray-600 whitespace-nowrap">
                        {typeInfo.label === 'Master' ? '—' : formatDate(p.date)}
                      </td>

                      <td className="p-4 text-gray-600">
                        <span className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 text-[11px] font-bold px-2 py-1 rounded-lg border border-gray-200">
                          <Building2 size={14} className="text-gray-400" />
                          {getDeptName(p)}
                        </span>
                      </td>

                      <td className="p-4 text-gray-600">
                        {p.createdBy?._id === user?._id ? (
                          <span className="text-emerald-700 font-extrabold">You</span>
                        ) : (
                          p.createdBy?.name || '—'
                        )}
                      </td>

                      <td className="p-4">
                        <StatusBadge status={p.status} />
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2 items-center">
                          {canUserEdit(p) && (
                            <button
                              onClick={(e) => handleEditClick(e, p)}
                              className="p-2 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors"
                              title="Edit Program"
                            >
                              <Edit3 size={16} />
                            </button>
                          )}

                          {canManageParticipants(p) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProgramForParticipants(p);
                              }}
                              className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-xl text-xs font-extrabold hover:bg-blue-100 transition-colors border border-blue-100 opacity-0 group-hover:opacity-100"
                            >
                              <Users size={14} /> Manage Participants
                            </button>
                          )}

                          {canActOnPending(p) && (
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                              <button
                                onClick={(e) => handleStatusUpdate(e, p._id, 'Approved')}
                                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-extrabold"
                              >
                                <Check size={14} /> Approve
                              </button>
                              <button
                                onClick={(e) => handleStatusUpdate(e, p._id, 'Rejected')}
                                className="inline-flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-xl text-xs font-extrabold border border-red-100"
                              >
                                <X size={14} /> Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {globalList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12">
                      <EmptyState />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <ManageParticipantsModal
        isOpen={!!selectedProgramForParticipants}
        onClose={() => setSelectedProgramForParticipants(null)}
        program={selectedProgramForParticipants}
        onSuccess={fetchPrograms}
      />

      <EditProgramModal
        isOpen={!!editingProgram}
        onClose={() => setEditingProgram(null)}
        program={editingProgram}
        onSuccess={fetchPrograms}
      />
    </div>
  );
};

// ----------------- UI Components -----------------
const StatPill = ({ label, value, color = 'slate' }) => {
  const styles = {
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    slate: 'bg-gray-50 text-gray-700 border-gray-200',
  };
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-extrabold ${styles[color]}`}>
      <span className="opacity-80">{label}</span>
      <span className="bg-white/70 px-2 py-0.5 rounded-lg border border-black/5">{value}</span>
    </div>
  );
};

const TogglePill = ({ enabled, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-extrabold transition ${
      enabled
        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
    }`}
  >
    <Icon size={14} />
    {label}
  </button>
);

const Chip = ({ label, onRemove }) => (
  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold">
    <span className="truncate max-w-[220px]">{label}</span>
    <button
      onClick={onRemove}
      className="w-5 h-5 inline-flex items-center justify-center rounded-full bg-white border border-gray-200 hover:bg-gray-50"
      title="Remove"
    >
      <X size={12} className="text-gray-500" />
    </button>
  </div>
);

const SectionTitle = ({ icon: Icon, title, count, color = 'slate' }) => {
  const map = {
    amber: 'text-amber-700 bg-amber-50 border-amber-100',
    blue: 'text-blue-700 bg-blue-50 border-blue-100',
    slate: 'text-gray-700 bg-gray-50 border-gray-100',
  };
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
        <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border ${map[color]}`}>
          <Icon size={18} />
        </span>
        {title}
      </h3>
      <span className="text-xs font-extrabold text-gray-500 bg-white px-2.5 py-1 rounded-xl border border-gray-200">
        {count}
      </span>
    </div>
  );
};

const ProgramCard = ({
  program,
  onClick,
  onAction,
  onEdit,
  formatDate,
  canAct,
  isOwner,
  canEdit,
  typeInfo,
  onManageParticipants,
}) => {
  const leftBar =
    typeInfo?.label === 'Master'
      ? 'bg-purple-500'
      : typeInfo?.label === 'Version'
      ? 'bg-blue-500'
      : isOwner
      ? 'bg-blue-400'
      : 'bg-emerald-500';

  return (
    <div
      onClick={onClick}
      className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden hover:shadow-md transition cursor-pointer"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${leftBar}`} />

      <div className="pl-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-extrabold text-gray-900 text-base line-clamp-1">{program.name}</h4>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold border uppercase ${typeInfo.color}`}>
              <typeInfo.icon size={12} />
              {typeInfo.label}
            </span>

            <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
              {program.type || 'Program'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canEdit && (
            <button
              onClick={(e) => onEdit(e, program)}
              className="p-2 rounded-xl bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-700 transition"
              title="Edit"
            >
              <Edit3 size={16} />
            </button>
          )}

          {program.status === 'Pending' ? (
            <span className={`px-2 py-1 rounded-lg text-[10px] font-extrabold border ${
              isOwner ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-amber-50 text-amber-700 border-amber-100'
            }`}>
              {isOwner ? 'Pending' : 'Review'}
            </span>
          ) : (
            <StatusBadge status={program.status} />
          )}
        </div>
      </div>

      <p className="pl-3 mt-3 text-gray-600 text-xs leading-relaxed line-clamp-2 min-h-[2.5em]">
        {program.description || 'No description provided.'}
      </p>

      <div className="pl-3 mt-4 flex flex-wrap gap-2 text-[10px] font-extrabold text-gray-500">
        {typeInfo.label !== 'Master' && (
          <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg">
            <Calendar size={12} className="text-gray-400" />
            {formatDate(program.date)}
          </span>
        )}

        <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg">
          <DollarSign size={12} className="text-gray-400" />
          ₦{(program.cost || 0).toLocaleString()}
        </span>

        <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg">
          <Building2 size={12} className="text-gray-400" />
          {program.department?.name || 'General'}
        </span>

        <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg">
          <UserIcon size={12} className="text-gray-400" />
          {program.createdBy?.name || '—'}
        </span>
      </div>

      <div className="pl-3 mt-4 flex flex-wrap gap-2">
        {onManageParticipants && (
          <button
            onClick={onManageParticipants}
            className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-xl text-xs font-extrabold hover:bg-blue-100 transition border border-blue-100"
          >
            <Users size={14} /> Participants
          </button>
        )}

        {canAct && program.status === 'Pending' && (
          <>
            <button
              onClick={(e) => onAction(e, program._id, 'Approved')}
              className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-extrabold transition"
            >
              <Check size={14} /> Approve
            </button>
            <button
              onClick={(e) => onAction(e, program._id, 'Rejected')}
              className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-xl text-xs font-extrabold transition border border-red-100"
            >
              <X size={14} /> Reject
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    Approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Ongoing: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    Rejected: 'bg-red-100 text-red-700 border-red-200',
    Completed: 'bg-blue-100 text-blue-800 border-blue-200',
    Pending: 'bg-amber-100 text-amber-800 border-amber-200',
    Cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border uppercase tracking-wider ${styles[status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
      {status || 'Unknown'}
    </span>
  );
};

const EmptyState = () => (
  <div className="p-10 text-center text-gray-400">
    <div className="mx-auto w-16 h-16 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
      <FileText className="opacity-20" />
    </div>
    <p className="font-extrabold text-gray-700">No programs found.</p>
    <p className="text-sm mt-1">Try clearing filters or changing your search.</p>
  </div>
);

export default ProgramRequests;
