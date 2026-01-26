import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';

// ✅ IMPORT UI CONTEXT
import { useUI } from '../context/UIContext';

// Loader
import Loader from '../components/Loader';

// Modals
import AddProgramModal from '../components/AddProgramModal';
import EditProgramModal from '../components/EditProgramModal';
import CompleteProgramModal from '../components/CompleteProgramModal';
import AddStaffModal from '../components/AddStaffModal';

// Charts
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';

import {
  ArrowLeft, Building2, Plus, User, Calendar, CheckCircle, Clock, Shield, 
  Briefcase, ArrowRightLeft, Trash2, Globe, Crown, UserMinus, Layers, Hash, 
  Search, Filter, X, SlidersHorizontal, TrendingUp, Target, Activity, Users, LayoutGrid
} from 'lucide-react';

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

const DepartmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { showToast, confirmAction } = useUI();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);

  // UI State
  const [activeTab, setActiveTab] = useState('overview'); // Default to Overview
  const [programSearch, setProgramSearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');

  // Filters
  const [programStatus, setProgramStatus] = useState('All');
  const [programType, setProgramType] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [staffRole, setStaffRole] = useState('All');
  const [staffState, setStaffState] = useState('All');

  // --- USER CONTEXT ---
  let user = {};
  try { user = JSON.parse(localStorage.getItem('user')) || {}; } catch (e) { console.error(e); }
  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  const fetchAllData = async () => {
    try {
      const response = await API.get(`/departments/${id}`);
      setData(response.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load department details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllData(); }, [id]);

  // --- KPI & CHART CALCULATIONS (NO FINANCE) ---
  const kpiData = useMemo(() => {
      if (!data) return null;
      const programs = data.programs || [];
      const staff = data.staff || [];

      // 1. Execution Rate (Completed / Total)
      const completedCount = programs.filter(p => p.status === 'Completed').length;
      const executionRate = programs.length > 0 ? Math.round((completedCount / programs.length) * 100) : 0;

      // 2. Total Beneficiaries
      let totalBeneficiaries = 0;
      programs.forEach(p => {
          totalBeneficiaries += (p.participantsCount || p.actualAttendance || 0);
      });

      // 3. Staff Load
      const activeStaff = staff.filter(s => s.status === 'Active').length;
      const activePrograms = programs.filter(p => p.status === 'Ongoing' || p.status === 'Approved').length;
      const loadRatio = activeStaff > 0 ? (activePrograms / activeStaff).toFixed(1) : 0;

      // 4. Monthly Trend Data (Last 6 Months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const trendDataMap = {};
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const label = months[d.getMonth()];
          trendDataMap[label] = { name: label, Beneficiaries: 0, Programs: 0 };
      }

      programs.forEach(p => {
          const d = new Date(p.date || p.createdAt);
          const label = months[d.getMonth()];
          if (trendDataMap[label]) {
              trendDataMap[label].Programs += 1;
              trendDataMap[label].Beneficiaries += (p.participantsCount || p.actualAttendance || 0);
          }
      });

      // 5. Status Distribution Data
      const statusData = [
          { name: 'Completed', value: completedCount },
          { name: 'Ongoing', value: programs.filter(p => p.status === 'Ongoing').length },
          { name: 'Pending', value: programs.filter(p => p.status === 'Pending').length },
          { name: 'Approved', value: programs.filter(p => p.status === 'Approved').length },
      ].filter(d => d.value > 0);

      return {
          executionRate,
          totalBeneficiaries,
          loadRatio,
          trendData: Object.values(trendDataMap),
          statusData
      };
  }, [data]);

  // --- HELPERS ---
  const safeLower = (v) => (v || '').toString().toLowerCase();
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    return `http://localhost:5000/${path.startsWith('/') ? path.substring(1) : path}`;
  };

  const getTypeInfo = (p) => {
    if (!p?.parentProgram && (p?.structure === 'Recurring' || p?.structure === 'Numerical')) {
      return { key: 'Master', label: 'Master Blueprint', pill: 'bg-purple-50 text-purple-700 border-purple-200', stripe: 'bg-purple-500', icon: Layers };
    }
    if (p?.parentProgram) {
      return { key: 'Version', label: 'Batch / Version', pill: 'bg-blue-50 text-blue-700 border-blue-200', stripe: 'bg-blue-500', icon: Hash };
    }
    return { key: 'Standard', label: 'Standard', pill: 'bg-slate-50 text-slate-700 border-slate-200', stripe: 'bg-emerald-500', icon: null };
  };

  const statusStyles = (status) => {
    const map = {
      Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Ongoing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      Completed: 'bg-sky-50 text-sky-700 border-sky-200',
      Pending: 'bg-amber-50 text-amber-700 border-amber-200',
      Rejected: 'bg-red-50 text-red-700 border-red-200',
      Cancelled: 'bg-slate-50 text-slate-700 border-slate-200',
    };
    return map[status] || map.Cancelled;
  };

  // --- PERMISSIONS & DATA PREP ---
  const department = data?.department;
  const staffRaw = (data?.staff || []).filter(Boolean);
  const programsRaw = (data?.programs || []).filter(Boolean);
  const headId = department?.headOfDepartment?._id || department?.headOfDepartment;
  const departmentHead = staffRaw.find((m) => m._id === headId) || null;

  const userDepts = Array.isArray(user.departments) ? user.departments.filter(Boolean) : [];
  const isMember = userDepts.some(d => (typeof d === 'string' ? d : d?._id) === id);
  const isDeptAdmin = user.role === 'ADMIN' && headId === user._id;
  const canCreateProgram = isSuperAdmin || isMember;
  const canManageStaff = isSuperAdmin || isDeptAdmin;

  // --- ACTIONS ---
  const handlePromote = async (userId, staffName) => {
    if (await confirmAction(`Promote ${staffName} to Head?`, "Promote Staff", { confirmText: "Promote", type: "info" })) {
        try { await API.put('/departments/assign-admin', { userId, departmentId: id }); showToast(`${staffName} promoted.`, 'success'); fetchAllData(); } 
        catch (err) { showToast('Failed to promote.', 'error'); }
    }
  };
  const handleDemote = async (departmentId) => {
    if (await confirmAction(`Revoke Admin rights from current head?`, "Revoke Access", { confirmText: "Revoke", type: "danger" })) {
        try { await API.put('/departments/revoke-admin', { departmentId }); showToast('Rights revoked.', 'success'); fetchAllData(); } 
        catch (err) { showToast('Failed.', 'error'); }
    }
  };
  const handleRemoveStaff = async (userId, staffName) => {
    if (await confirmAction(`Remove ${staffName} from department?`, "Remove Staff", { type: "danger" })) {
        try { await API.put('/departments/remove-member', { userId, departmentId: id }); showToast('Removed.', 'success'); fetchAllData(); } 
        catch (err) { showToast('Failed.', 'error'); }
    }
  };
  const handleMigrateStaff = async (userId, staffName) => {
    const newDeptId = prompt(`New Department ID for ${staffName}:`);
    if(newDeptId) {
        try { await API.post('/users/migrate', { userId, oldDeptId: id, newDeptId }); showToast('Migrated.', 'success'); fetchAllData(); } 
        catch (err) { showToast('Failed.', 'error'); }
    }
  };

  // --- FILTERS ---
  const filteredPrograms = useMemo(() => {
    let result = [...programsRaw];
    const q = safeLower(programSearch);
    if (q) result = result.filter(p => safeLower(p.name).includes(q) || safeLower(p.description).includes(q));
    if (programStatus !== 'All') result = result.filter(p => p.status === programStatus);
    if (programType !== 'All') result = result.filter(p => getTypeInfo(p).key === programType);
    
    result.sort((a, b) => {
       const dA = new Date(a.createdAt || 0).getTime();
       const dB = new Date(b.createdAt || 0).getTime();
       return sortBy === 'newest' ? dB - dA : dA - dB; 
    });
    return result;
  }, [programsRaw, programSearch, programStatus, programType, sortBy]);

  const filteredStaff = useMemo(() => {
    let result = [...staffRaw];
    const q = safeLower(staffSearch);
    if (q) result = result.filter(s => safeLower(s.name).includes(q) || safeLower(s.email).includes(q));
    if (staffRole !== 'All') result = result.filter(s => s.role === staffRole);
    if (staffState !== 'All') result = result.filter(s => s.status === staffState);
    return result;
  }, [staffRaw, staffSearch, staffRole, staffState]);

  if (loading) return <Loader text="Loading Department..." />;
  if (!data) return <div className="p-10 text-center text-red-600 font-bold">Department Not Found</div>;

  const deptName = department?.name || 'Unnamed Department';
  const deptDesc = department?.description || 'No description available.';

  return (
    <div className="min-h-screen bg-slate-50 px-4 md:px-8 py-6 animate-in fade-in pb-20">
      
      {/* 1. TOP NAVIGATION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-2 text-slate-600 hover:text-emerald-700 transition-colors font-semibold">
            <ArrowLeft size={18} /> Back to Dashboard
          </button>
          <span className="hidden sm:inline-block text-slate-300">•</span>
          <button onClick={() => navigate('/departments')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold inline-flex items-center gap-2 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition shadow-sm">
            <Globe size={16} /> View All Depts
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Overview</TabButton>
          <TabButton active={activeTab === 'programs'} onClick={() => setActiveTab('programs')}>Programs</TabButton>
          <TabButton active={activeTab === 'staff'} onClick={() => setActiveTab('staff')}>Staff</TabButton>

          {activeTab === 'programs' && canCreateProgram && (
            <button onClick={() => setIsProgramModalOpen(true)} className="ml-auto bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-2 hover:bg-emerald-700 transition shadow-lg shadow-emerald-200">
              <Plus size={16} /> New Program
            </button>
          )}
          {activeTab === 'staff' && canManageStaff && (
            <button onClick={() => setIsStaffModalOpen(true)} className="ml-auto bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-2 hover:bg-emerald-700 transition shadow-lg shadow-emerald-200">
              <Plus size={16} /> Add Staff
            </button>
          )}
        </div>
      </div>

      {/* 2. HERO CARD */}
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm mb-8">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-950 via-emerald-700 to-emerald-500 opacity-90" />
        <div className="p-6 relative flex flex-col lg:flex-row justify-between items-start gap-6">
            <div className="flex items-start gap-5">
                <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700 shrink-0">
                    <Building2 size={30} />
                </div>
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">{deptName}</h1>
                    <p className="text-slate-500 text-sm max-w-2xl mt-1">{deptDesc}</p>
                </div>
            </div>
            
            {/* Dept Head Mini Widget */}
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
                <Crown size={16} className="text-amber-500 fill-amber-500"/>
                {departmentHead ? (
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Head</p>
                        <p className="text-sm font-bold text-slate-800">{departmentHead.name}</p>
                    </div>
                ) : <span className="text-sm text-slate-400 italic">No Head Assigned</span>}
                {isSuperAdmin && departmentHead && (
                    <button onClick={() => handleDemote(department._id)} className="ml-2 text-red-400 hover:text-red-600"><UserMinus size={16}/></button>
                )}
            </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT AREA */}
      
      {/* --- VIEW: OVERVIEW (KPIs - NO COST) --- */}
      {activeTab === 'overview' && kpiData && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              
              {/* KPI CARDS (3 Columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <KpiCard title="Execution Rate" value={`${kpiData.executionRate}%`} icon={<Target size={20}/>} color="bg-emerald-50 text-emerald-600" />
                  <KpiCard title="Total Beneficiaries" value={kpiData.totalBeneficiaries.toLocaleString()} icon={<Users size={20}/>} color="bg-blue-50 text-blue-600" />
                  <KpiCard title="Staff Load Ratio" value={kpiData.loadRatio} subtitle="Programs/Staff" icon={<Activity size={20}/>} color="bg-purple-50 text-purple-600" />
              </div>

              {/* CHARTS ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Impact Trend */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                      <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><TrendingUp size={18} className="text-emerald-500"/> Impact Velocity (6 Months)</h3>
                      <div className="h-[300px] w-full">
                          <ResponsiveContainer>
                              <AreaChart data={kpiData.trendData}>
                                  <defs>
                                      <linearGradient id="colorBen" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                      </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10}/>
                                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}}/>
                                  <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}/>
                                  <Area type="monotone" dataKey="Beneficiaries" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorBen)" />
                              </AreaChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  {/* Right: Program Status */}
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
                      <h3 className="font-bold text-slate-800 mb-2">Program Health</h3>
                      <div className="flex-1 min-h-[250px] relative">
                          <ResponsiveContainer>
                              <PieChart>
                                  <Pie data={kpiData.statusData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                      {kpiData.statusData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                      ))}
                                  </Pie>
                                  <RechartsTooltip />
                              </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                              <span className="text-3xl font-black text-slate-800">{programsRaw.length}</span>
                              <span className="text-xs text-slate-400 font-bold uppercase">Total</span>
                          </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4 justify-center">
                          {kpiData.statusData.map((entry, index) => (
                              <div key={index} className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: CHART_COLORS[index % CHART_COLORS.length]}}></div>
                                  {entry.name} ({entry.value})
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- VIEW: PROGRAMS --- */}
      {activeTab === 'programs' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-4 md:p-5">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-3 text-slate-400" />
                <input value={programSearch} onChange={(e) => setProgramSearch(e.target.value)} placeholder="Search programs..." className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm font-semibold text-slate-700" />
                {programSearch && <button onClick={() => setProgramSearch('')} className="absolute right-3 top-2.5 p-1 rounded-full hover:bg-slate-200 text-slate-500"><X size={16}/></button>}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <SelectPill icon={<Filter size={14} />} value={programStatus} onChange={setProgramStatus} options={['All', 'Pending', 'Approved', 'Ongoing', 'Completed', 'Rejected']} label="Status" />
                <SelectPill icon={<Layers size={14} />} value={programType} onChange={setProgramType} options={['All', 'Standard', 'Master', 'Version']} label="Type" />
                <SelectPill icon={<SlidersHorizontal size={14} />} value={sortBy} onChange={setSortBy} options={[{ value: 'newest', label: 'Newest' }, { value: 'oldest', label: 'Oldest' }]} label="Sort" />
              </div>
            </div>
          </div>

          {filteredPrograms.length === 0 ? (
            <EmptyState title="No programs match filters" subtitle="Try clearing filters or create a new program." actionLabel={canCreateProgram ? 'New Program' : null} onAction={() => setIsProgramModalOpen(true)} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredPrograms.map((p) => (
                <ProgramCard key={p._id} program={p} typeInfo={getTypeInfo(p)} statusClass={statusStyles(p.status)} onOpen={() => navigate(`/programs/${p._id}`)} onEdit={() => { setSelectedProgram(p); setIsEditModalOpen(true); }} onComplete={() => { setSelectedProgram(p); setIsCompleteModalOpen(true); }} canEdit={canCreateProgram} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- VIEW: STAFF --- */}
      {activeTab === 'staff' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-4 md:p-5">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-3 text-slate-400" />
                <input value={staffSearch} onChange={(e) => setStaffSearch(e.target.value)} placeholder="Search staff..." className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm font-semibold text-slate-700" />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <SelectPill icon={<Shield size={14} />} value={staffRole} onChange={setStaffRole} options={['All', 'SUPER_ADMIN', 'ADMIN', 'STAFF']} label="Role" />
                <SelectPill icon={<Clock size={14} />} value={staffState} onChange={setStaffState} options={['All', 'Active', 'Pending', 'Suspended']} label="Status" />
              </div>
            </div>
          </div>

          {filteredStaff.length === 0 ? (
            <EmptyState title="No staff match filters" subtitle="Try clearing filters or add staff." actionLabel={canManageStaff ? 'Add Staff' : null} onAction={() => setIsStaffModalOpen(true)} />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredStaff.map((s) => (
                <StaffCard key={s._id} staff={s} isHead={departmentHead?._id === s._id} canManage={canManageStaff} canPromote={isSuperAdmin && departmentHead?._id !== s._id} onPromote={() => handlePromote(s._id, s.name)} onMove={() => handleMigrateStaff(s._id, s.name)} onRemove={() => handleRemoveStaff(s._id, s.name)} avatarUrl={getImageUrl(s.profilePicture)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* SHARED MODALS */}
      {canCreateProgram && (
        <>
          <AddProgramModal isOpen={isProgramModalOpen} onClose={() => setIsProgramModalOpen(false)} departmentId={id} onSuccess={fetchAllData} />
          <EditProgramModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} program={selectedProgram} onSuccess={fetchAllData} />
          <CompleteProgramModal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} program={selectedProgram} onSuccess={fetchAllData} />
        </>
      )}
      {canManageStaff && (
        <AddStaffModal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} preSelectedDept={id} disableAdminRole={!!departmentHead} onSuccess={fetchAllData} />
      )}
    </div>
  );
};

/* --- SUB COMPONENTS --- */

const KpiCard = ({ title, value, subtitle, icon, color }) => (
    <div className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm flex items-center gap-4 hover:border-emerald-200 hover:shadow-md transition cursor-default">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>{icon}</div>
        <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{title}</p>
            <p className="text-xl font-black text-slate-800">{value}</p>
            {subtitle && <p className="text-[9px] text-slate-400 font-bold">{subtitle}</p>}
        </div>
    </div>
);

const TabButton = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`px-4 py-2 rounded-xl text-sm font-extrabold border transition ${active ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
    {children}
  </button>
);

const SelectPill = ({ icon, label, value, onChange, options }) => {
  const normalized = Array.isArray(options) ? options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o)) : [];
  return (
    <div className="relative w-full sm:w-[150px]">
      <div className="absolute left-3 top-3 text-slate-400">{icon}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full pl-9 pr-8 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-extrabold text-slate-700 outline-none hover:bg-slate-50 focus:border-emerald-500 appearance-none cursor-pointer">
        {normalized.map((opt) => <option key={opt.value} value={opt.value}>{label}: {opt.label}</option>)}
      </select>
      <Filter size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none"/>
    </div>
  );
};

const Chip = ({ label, onClear, tone = 'emerald' }) => {
  const styles = { emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100', slate: 'bg-slate-50 text-slate-700 border-slate-200' };
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-extrabold ${styles[tone]}`}>
      {label}
      {onClear && <button onClick={onClear} className="hover:bg-white/70 rounded-full p-0.5"><X size={14} /></button>}
    </span>
  );
};

const EmptyState = ({ title, subtitle, actionLabel, onAction }) => (
  <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-10 text-center shadow-sm">
    <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl mb-4">✨</div>
    <h4 className="font-extrabold text-slate-800">{title}</h4>
    <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
    {actionLabel && onAction && (
      <button onClick={onAction} className="mt-5 inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-extrabold hover:bg-emerald-700 transition shadow-lg shadow-emerald-200">
        <Plus size={16} /> {actionLabel}
      </button>
    )}
  </div>
);

const ProgramCard = ({ program, typeInfo, statusClass, onOpen, canEdit, onEdit, onComplete }) => {
  const TypeIcon = typeInfo?.icon;
  const dateText = typeInfo?.key === 'Master' ? 'Master Blueprint' : new Date(program?.date || '').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  return (
    <div onClick={onOpen} className="relative overflow-hidden bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition cursor-pointer group">
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${typeInfo?.stripe || 'bg-emerald-500'}`} />
      <div className="p-5 pl-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-slate-50 border border-slate-200 text-slate-700 px-2 py-1 rounded-lg">{program?.type || 'Program'}</span>
              {typeInfo?.key !== 'Standard' && (
                <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded-lg border inline-flex items-center gap-1 ${typeInfo.pill}`}>
                  {TypeIcon ? <TypeIcon size={12} /> : null} {typeInfo.label}
                </span>
              )}
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-emerald-700 transition line-clamp-1">{program?.name}</h3>
            <p className="text-sm text-slate-500 mt-1 line-clamp-2 min-h-[2.5em]">{program?.description || 'No description provided.'}</p>
          </div>
          <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-extrabold border inline-flex items-center gap-1 ${statusClass}`}>
            {program?.status === 'Completed' ? <CheckCircle size={14} /> : <Clock size={14} />} {program?.status || 'Unknown'}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-extrabold text-slate-500">
          <span className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-2xl"><Calendar size={14} className="text-slate-400" /> {dateText}</span>
          <span className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-2xl"><User size={14} className="text-slate-400" /> {program?.createdBy?.name || 'Unknown'}</span>
          {typeInfo?.key === 'Master' && <span className="inline-flex items-center gap-2 bg-purple-50 border border-purple-100 text-purple-700 px-3 py-2 rounded-2xl"><Layers size={14} /> {program?.children?.length || 0} Batches</span>}
        </div>
        {canEdit && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={(e) => { e.stopPropagation(); onEdit?.(); }} className="px-4 py-2 rounded-2xl text-xs font-extrabold border bg-white text-slate-700 border-slate-200 hover:bg-slate-50 transition inline-flex items-center gap-2"><Shield size={14} className="text-slate-400" /> Edit</button>
            {program?.status !== 'Completed' && <button onClick={(e) => { e.stopPropagation(); onComplete?.(); }} className="px-4 py-2 rounded-2xl text-xs font-extrabold border bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 transition inline-flex items-center gap-2"><CheckCircle size={14} /> Mark Complete</button>}
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition"><div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-emerald-200 blur-3xl opacity-30" /></div>
    </div>
  );
};

const StaffCard = ({ staff, isHead, canManage, canPromote, onPromote, onMove, onRemove, avatarUrl }) => (
  <div className={`bg-white border rounded-3xl p-5 shadow-sm hover:shadow-md transition relative overflow-hidden ${isHead ? 'border-amber-200' : 'border-slate-200'}`}>
    {isHead && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500" />}
    <div className={`flex items-start gap-4 ${isHead ? 'pl-4' : ''}`}>
      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0">
        {avatarUrl ? <img src={avatarUrl} alt="Staff" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-extrabold text-slate-500">{(staff?.name || '?').charAt(0)}</div>}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-extrabold text-slate-900 truncate">{staff?.name || 'Unknown'}</p>
          {isHead && <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-widest"><Crown size={12} className="text-amber-500 fill-amber-500" /> Head</span>}
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full uppercase tracking-widest">{staff?.role || 'STAFF'}</span>
        </div>
        <p className="text-xs text-emerald-700 font-bold truncate mt-1">{staff?.position || 'Staff'}</p>
        <p className="text-[11px] text-slate-500 truncate mt-1">{staff?.email || 'No email'}</p>
      </div>
      <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-extrabold border ${staff?.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : staff?.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{staff?.status || 'Unknown'}</span>
    </div>
    {canManage && (
      <div className={`mt-4 flex flex-wrap gap-2 ${isHead ? 'pl-4' : ''}`}>
        {canPromote && <button onClick={onPromote} className="px-4 py-2 rounded-2xl text-xs font-extrabold border bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 transition inline-flex items-center gap-2"><Shield size={14} /> Promote</button>}
        <button onClick={onMove} className="px-4 py-2 rounded-2xl text-xs font-extrabold border bg-white text-slate-700 border-slate-200 hover:bg-slate-50 transition inline-flex items-center gap-2"><ArrowRightLeft size={14} /> Move</button>
        <button onClick={onRemove} className="px-4 py-2 rounded-2xl text-xs font-extrabold border bg-red-50 text-red-700 border-red-100 hover:bg-red-100 transition inline-flex items-center gap-2"><Trash2 size={14} /> Remove</button>
      </div>
    )}
  </div>
);

export default DepartmentDetails;