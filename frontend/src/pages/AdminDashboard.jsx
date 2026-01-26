import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { motion } from 'framer-motion'; 

// --- COMPONENTS ---
import StaffList from '../components/StaffList'; 
import AddStaffModal from '../components/AddStaffModal'; 
import ProgramRequests from '../components/ProgramRequests'; 
import GlobalReports from '../components/GlobalReports';
import BroadcastCenter from '../components/BroadcastCenter';
import SystemSettings from './SystemSettings';

// --- ANALYTICS ---
import DepartmentChart from '../components/DepartmentChart';
import ExpandableChartCard from '../components/ExpandableChartCard';

// --- ASSETS & ICONS ---
import logo from '../assets/logo.png'; 
import { 
  LayoutDashboard, Building2, Users, Settings, LogOut, Activity, Plus, Search, 
  FileText, X, Menu, CheckCircle, AlertCircle, FileCheck, Megaphone, 
  Globe, Layers, Mail, TrendingUp
} from 'lucide-react';

// --- RECHARTS ---
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, AreaChart, Area
} from 'recharts';

// --- CONFIGURATION ---
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"; 

const BrandColors = {
  primary: "bg-emerald-600",
  primaryHover: "hover:bg-emerald-700",
  sidebar: "bg-emerald-950", 
  lightBg: "bg-gray-50",
};

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

// --- HELPER: GET IMAGE URL ---
const getProfileImage = (path) => {
    if (!path) return null;
    if (path.startsWith('blob:')) return path; 
    if (path.startsWith('http')) return path;  
    return `${BACKEND_URL}${path}`; 
};

// --- ANIMATION VARIANTS ---
const sidebarVariants = {
  hidden: { opacity: 0 }, 
  visible: { 
    opacity: 1, 
    transition: { duration: 0.4, when: "beforeChildren", staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// --- CUSTOM TOOLTIP ---
const CustomChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 border border-gray-100 p-4 rounded-2xl shadow-xl backdrop-blur-md min-w-[150px]">
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2">{label}</p>
          {payload.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <p className="text-xs font-bold text-gray-700">
                      {entry.name}: <span className="text-sm font-black" style={{ color: entry.color }}>{entry.value}</span>
                  </p>
              </div>
          ))}
        </div>
      );
    }
    return null;
};

// --- MAIN COMPONENT ---
const AdminDashboard = () => {
  const navigate = useNavigate();
  
  const [user, setUser] = useState(() => {
      try { return JSON.parse(localStorage.getItem('user')); } catch (e) { return null; }
  });
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reportView, setReportView] = useState('overview'); 
  const [stats, setStats] = useState(null);
  const [pieData, setPieData] = useState([]); 
  const [rawPrograms, setRawPrograms] = useState([]); 
  const [loading, setLoading] = useState(true);

  const isStaff = user?.role === 'STAFF';

  // --- CHART STATE ---
  const [chartData, setChartData] = useState([]); 
  const [chartTimeFrame, setChartTimeFrame] = useState('1Y'); 
  const [customRange, setCustomRange] = useState({
      start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  // --- FETCH DATA ---
  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    
    const fetchDashboardData = async () => {
        try {
          const statsRes = await API.get('/dashboard/stats');
          setStats(statsRes.data);

          const chartsRes = await API.get('/dashboard/charts');
          setPieData(chartsRes.data.chart2 || []); 

          const programsRes = await API.get('/programs'); 
          setRawPrograms(Array.isArray(programsRes.data) ? programsRes.data : []);

        } catch (err) { console.error("Dashboard fetch error", err); } 
        finally { setLoading(false); }
    };
    fetchDashboardData();
  }, [user, navigate]);

  // --- DATA PROCESSING (DYNAMIC DATE FILTERING) ---
  useEffect(() => {
    if (!rawPrograms.length) return;

    const now = new Date();
    let startDate, endDate;
    let granularity = 'Month'; 

    if (chartTimeFrame === '1W') { startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); endDate = now; granularity = 'Day'; } 
    else if (chartTimeFrame === '1M') { startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); endDate = now; granularity = 'Day'; }
    else if (chartTimeFrame === '6M') { startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000); endDate = now; granularity = 'Month'; }
    else if (chartTimeFrame === '1Y') { startDate = new Date(now.getFullYear(), 0, 1); endDate = now; granularity = 'Month'; }
    else if (chartTimeFrame === 'All') { startDate = new Date(2023, 0, 1); endDate = now; granularity = 'Year'; }
    else if (chartTimeFrame === 'Custom') {
        startDate = new Date(customRange.start);
        endDate = new Date(customRange.end);
        const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        granularity = diffDays > 60 ? 'Month' : 'Day';
    }

    const dataMap = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    let current = new Date(startDate);
    while (current <= endDate) {
        let label = '';
        if (granularity === 'Day') label = `${current.getDate()} ${months[current.getMonth()]}`;
        else if (granularity === 'Month') label = `${months[current.getMonth()]} '${current.getFullYear().toString().substr(-2)}`;
        else label = current.getFullYear().toString();
        
        dataMap[label] = { name: label, Programs: 0, Impact: 0 };
        
        if (granularity === 'Day') current.setDate(current.getDate() + 1);
        else if (granularity === 'Month') current.setMonth(current.getMonth() + 1);
        else current.setFullYear(current.getFullYear() + 1);
    }

    rawPrograms.forEach(p => {
        const pDate = new Date(p.date || p.createdAt);
        if (pDate >= startDate && pDate <= endDate) {
            let label = '';
            if (granularity === 'Day') label = `${pDate.getDate()} ${months[pDate.getMonth()]}`;
            else if (granularity === 'Month') label = `${months[pDate.getMonth()]} '${pDate.getFullYear().toString().substr(-2)}`;
            else label = pDate.getFullYear().toString();

            if (dataMap[label]) {
                dataMap[label].Programs += 1;
                // ✅ UPDATED: Impact now refers to Beneficiaries
                dataMap[label].Impact += (p.participantsCount || p.actualAttendance || 0);
            }
        }
    });

    setChartData(Object.values(dataMap));
  }, [rawPrograms, chartTimeFrame, customRange]);

  const handleNavClick = (tabName) => { setActiveTab(tabName); setIsSidebarOpen(false); };
  const handleDepartmentClick = () => { navigate('/departments'); setIsSidebarOpen(false); };
  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setIsSidebarOpen(false); navigate('/login'); };
  const formatRole = (role) => role ? role.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : 'Admin';
  const openProfileModal = () => { setIsProfileModalOpen(true); };
  const goToReport = (viewName) => { setReportView(viewName); setActiveTab('reports'); };
  
  const getDepartmentLabel = () => {
      if (!user?.departments || user.departments.length === 0) return 'General';
      if (user.departments.length === 1) return user.departments[0].name || 'General';
      return 'Multiple Teams';
  };

  return (
    <div className={`flex h-screen ${BrandColors.lightBg} font-sans overflow-hidden selection:bg-emerald-200`}>
      {/* SIDEBAR */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)}></div>}
      <motion.aside 
        initial="hidden" animate="visible" variants={sidebarVariants}
        className={`fixed inset-y-0 left-0 z-50 w-72 ${BrandColors.sidebar} text-white flex flex-col shadow-2xl transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 md:w-80`}
      >
        <div className="p-8 md:p-10 flex items-center gap-4">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center hover:rotate-12 transition-transform duration-300">
             <img src={logo} alt="Dopals Logo" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
          </motion.div>
          <div><h1 className="text-lg md:text-xl font-bold tracking-wide">Dopals Tech</h1><p className="text-emerald-400 text-[10px] md:text-xs tracking-wider uppercase">Admin Portal</p></div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden ml-auto text-emerald-400 p-2 hover:bg-emerald-900/50 rounded-lg transition-colors"><X size={24} /></button>
        </div>
        
        <nav className="flex-1 px-4 md:px-6 space-y-2 mt-4 overflow-y-auto">
          <NavItem variants={itemVariants} active={activeTab === 'dashboard'} onClick={() => handleNavClick('dashboard')} icon={<LayoutDashboard size={20} />} label="Overview" />
          <NavItem variants={itemVariants} active={false} onClick={handleDepartmentClick} icon={<Building2 size={20} />} label="Departments" />
          <NavItem variants={itemVariants} active={activeTab === 'users'} onClick={() => handleNavClick('users')} icon={<Users size={20} />} label={user?.role === 'SUPER_ADMIN' ? "Staff Management" : "Staff List"} />
          <NavItem variants={itemVariants} active={activeTab === 'requests'} onClick={() => handleNavClick('requests')} icon={<FileCheck size={20} />} label="Programs" />
          <NavItem variants={itemVariants} active={activeTab === 'reports'} onClick={() => handleNavClick('reports')} icon={<FileText size={20} />} label="Global Reports" />
          <NavItem variants={itemVariants} active={activeTab === 'broadcast'} onClick={() => handleNavClick('broadcast')} icon={<Megaphone size={20} />} label="Broadcast Center" />
          <NavItem variants={itemVariants} active={activeTab === 'settings'} onClick={() => handleNavClick('settings')} icon={<Settings size={20} />} label="System Settings" />
        </nav>
        
        <div className="p-6 md:p-8">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={handleLogout} className="w-full flex items-center justify-center gap-3 bg-red-500/10 text-red-200 hover:bg-red-600 hover:text-white py-3 rounded-2xl transition-all font-bold border border-red-500/20 active:scale-95 group">
            <LogOut size={20} /><span>Sign Out</span>
          </motion.button>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col relative overflow-hidden w-full h-full">
        <header className="mx-4 md:mx-8 mt-4 md:mt-6 mb-2 p-3 md:p-4 bg-white/80 backdrop-blur-md rounded-3xl shadow-sm flex justify-between items-center z-10 border border-white/50 sticky top-4 shrink-0">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl"><Menu size={24} /></button>
            <span className="hidden md:flex items-center gap-2 bg-emerald-100/50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> {getDepartmentLabel()}
            </span>
            <div className="hidden md:flex items-center gap-3 bg-gray-100/50 px-4 py-2.5 rounded-full border border-gray-200 w-80 hover:bg-white hover:shadow-md transition-all">
              <Search size={18} className="text-gray-400" />
              <input type="text" placeholder="Global search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent outline-none text-sm text-gray-700 w-full placeholder-gray-400" />
            </div>
          </div>
          <div onClick={openProfileModal} className="flex items-center gap-2 md:gap-4 bg-white pl-2 pr-2 md:pr-6 py-1.5 rounded-full shadow-sm border border-gray-100 hover:shadow-md cursor-pointer group transition-all">
              <div className="w-9 h-9 md:w-11 md:h-11 rounded-full overflow-hidden border-2 border-emerald-100">
                {user?.profilePicture ? <img src={getProfileImage(user.profilePicture)} className="w-full h-full object-cover" alt="Profile" /> : <div className="w-full h-full bg-emerald-600 flex items-center justify-center text-white font-bold">{user?.name?.charAt(0)}</div>}
              </div>
              <div className="hidden md:block"><p className="text-sm font-bold text-gray-800 leading-tight">{user?.name}</p><p className="text-[10px] text-emerald-600 font-bold uppercase mt-0.5">{formatRole(user?.role)}</p></div>
          </div>
        </header>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 h-full overflow-y-auto p-4 md:p-8 pt-4 pb-20 scroll-smooth flex flex-col">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-enter">
              {/* HERO CARD */}
              <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-emerald-800 to-green-600 shadow-xl p-8 md:p-10 text-white">
                <div className="relative z-10">
                  <h3 className="text-2xl md:text-3xl font-bold mb-2">Welcome back, {user?.name?.split(' ')[0] || 'Admin'}! 👋</h3>
                  <p className="text-emerald-100 max-w-2xl text-sm md:text-base">
                      {isStaff 
                        ? "Here is your program performance breakdown and impact metrics." 
                        : "Here is your operational overview and analytics."}
                  </p>
                </div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
              </div>

              {/* STAT CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard onClick={() => handleDepartmentClick()} title={stats?.card1?.label} value={stats?.card1?.value} icon={<Building2 size={24}/>} color="bg-blue-50 text-blue-600" />
                <StatCard onClick={() => goToReport('programs')} title={stats?.card2?.label} value={stats?.card2?.value} icon={<Layers size={24}/>} color="bg-emerald-50 text-emerald-600" />
                <StatCard onClick={() => goToReport('overview')} title={stats?.card3?.label} value={stats?.card3?.value} icon={<CheckCircle size={24}/>} color="bg-purple-50 text-purple-600" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 <StatCard onClick={() => goToReport('departments')} title={stats?.card4?.label} value={stats?.card4?.value} icon={<Users size={24}/>} color="bg-orange-50 text-orange-600" />
                 <StatCard onClick={() => goToReport('impact')} title={stats?.card5?.label} value={stats?.card5?.value?.toLocaleString() || 0} icon={<Globe size={24}/>} color="bg-pink-50 text-pink-600" />
                 <StatCard onClick={() => setActiveTab('requests')} title={stats?.card6?.label} value={stats?.card6?.value} icon={<AlertCircle size={24}/>} color="bg-red-50 text-red-600" warning={stats?.card6?.value > 0} />
              </div>

              {/* ANALYTICS SECTION */}
              {!isStaff ? (
                  <div className="space-y-8">
                      {/* CHART 1: PROGRAMS vs IMPACT */}
                      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 h-auto relative overflow-hidden">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                              <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                  <TrendingUp className="text-emerald-500"/> Organizational Trends
                              </h4>
                              
                              <div className="flex flex-wrap gap-2">
                                  {['1W', '1M', '6M', '1Y', 'All', 'Custom'].map(tf => (
                                      <button 
                                          key={tf}
                                          onClick={() => setChartTimeFrame(tf)}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartTimeFrame === tf ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                      >
                                          {tf}
                                      </button>
                                  ))}
                              </div>
                          </div>

                          {chartTimeFrame === 'Custom' && (
                              <div className="flex gap-4 mb-6 bg-gray-50 p-4 rounded-xl items-center animate-in slide-in-from-top-2">
                                  <div className="flex flex-col">
                                      <label className="text-[10px] font-bold text-gray-400 uppercase">Start Date</label>
                                      <input type="date" value={customRange.start} onChange={e => setCustomRange({...customRange, start: e.target.value})} className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none focus:border-emerald-500"/>
                                  </div>
                                  <div className="h-px w-8 bg-gray-300"></div>
                                  <div className="flex flex-col">
                                      <label className="text-[10px] font-bold text-gray-400 uppercase">End Date</label>
                                      <input type="date" value={customRange.end} onChange={e => setCustomRange({...customRange, end: e.target.value})} className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none focus:border-emerald-500"/>
                                  </div>
                              </div>
                          )}
                          
                          <div className="h-[350px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#9ca3af'}} dy={10} />
                                      
                                      {/* Left Axis: Programs (Red) */}
                                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#ef4444'}} />
                                      
                                      {/* Right Axis: Impact (Green) */}
                                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#10b981'}} />
                                      
                                      <RechartsTooltip content={<CustomChartTooltip />} />
                                      
                                      <Line yAxisId="left" name="Programs" type="monotone" dataKey="Programs" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                      {/* ✅ UPDATED NAME: Impact (Beneficiaries) */}
                                      <Line yAxisId="right" name="Impact (Beneficiaries)" type="monotone" dataKey="Impact" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                  </LineChart>
                              </ResponsiveContainer>
                          </div>
                      </div>

                      {/* CHART 2: DEPARTMENT DISTRIBUTION */}
                      <div className="h-[400px]">
                          <ExpandableChartCard>
                              <DepartmentChart data={pieData} colors={CHART_COLORS} />
                          </ExpandableChartCard>
                      </div>
                  </div>
              ) : (
                  // STAFF PRODUCTIVITY CHART
                  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 h-[400px] relative overflow-hidden">
                      <div className="flex justify-between items-center mb-6">
                          <h4 className="font-bold text-gray-800 flex items-center gap-2"><Activity className="text-emerald-500"/> Your Productivity</h4>
                      </div>
                      <ResponsiveContainer width="100%" height="90%">
                          <AreaChart data={chartData}>
                              <defs>
                                <linearGradient id="colorPrograms" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                              <RechartsTooltip content={<CustomChartTooltip />} />
                              <Area type="monotone" dataKey="Programs" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPrograms)" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              )}
            </div>
          )}

          {activeTab === 'users' && <div className="animate-enter h-full flex flex-col"><div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0"><div><h2 className="text-2xl font-bold text-gray-800">Staff Management</h2><p className="text-gray-500 text-sm">Directory and access control.</p></div>{(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (<button onClick={() => setIsStaffModalOpen(true)} className="bg-emerald-600 text-white px-6 py-2.5 rounded-full font-bold shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2"><Plus size={18} /> Add Staff</button>)}</div><div className="flex-1 min-h-0"><StaffList searchQuery={searchTerm} currentUser={user} /></div></div>}
          {activeTab === 'requests' && <div className="animate-enter"><div className="mb-6"><h2 className="text-2xl font-bold text-gray-800">Program Requests</h2><p className="text-gray-500 text-sm">Approve or reject budget proposals.</p></div><ProgramRequests searchQuery={searchTerm} /></div>}
          {activeTab === 'reports' && <div className="animate-enter"><GlobalReports defaultView={reportView} /></div>}
          {activeTab === 'broadcast' && <div className="animate-enter"><BroadcastCenter /></div>}
          {activeTab === 'settings' && <div className="animate-enter"><SystemSettings /></div>}
          
          <div className="mt-auto pt-10 pb-4 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest opacity-60">Dopals Tech Management System © 2025</p>
            <p className="text-[9px] text-gray-300 mt-1">Version 1.2.0 • Authorized Access Only</p>
          </div>
        </main>
        
        <AddStaffModal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} onSuccess={() => window.location.reload()} />
        
        {isProfileModalOpen && (
          <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-enter">
              <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative">
                <div className="h-32 relative bg-gradient-to-r from-emerald-600 to-green-500">
                  <button onClick={() => setIsProfileModalOpen(false)} className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 p-2 rounded-full"><X size={20} /></button>
                  <div className="absolute -bottom-12 left-8">
                      <div className="w-24 h-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg relative flex items-center justify-center">
                        {user?.profilePicture ? <img src={getProfileImage(user.profilePicture)} className="w-full h-full object-cover" alt="Profile" /> : <div className="w-full h-full bg-emerald-600 flex items-center justify-center text-3xl font-bold text-emerald-700 bg-emerald-100">{user?.name[0]}</div>}
                      </div>
                  </div>
                </div>
                <div className="pt-16 pb-8 px-8">
                    <div>
                        <div className="flex justify-between items-start mb-6">
                            <div><h2 className="text-2xl font-bold text-gray-800">{user?.name}</h2><p className="text-emerald-600 font-bold text-xs uppercase mt-1">{user?.position}</p></div>
                        </div>
                        <div className="space-y-3">
                           <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-3"><Mail size={18} className="text-gray-400"/><div><p className="text-[10px] text-gray-400 uppercase font-bold">Email</p><p className="text-sm font-medium text-gray-700">{user?.email}</p></div></div>
                           <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-3"><CheckCircle size={18} className="text-gray-400"/><div><p className="text-[10px] text-gray-400 uppercase font-bold">Role</p><p className="text-sm font-medium text-gray-700">{formatRole(user?.role)}</p></div></div>
                        </div>
                    </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const NavItem = ({ active, icon, label, onClick, variants }) => (
  <motion.div variants={variants} onClick={onClick} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all relative overflow-hidden group ${active ? 'bg-emerald-800/80 text-white shadow-lg translate-x-1' : 'text-emerald-100/70 hover:bg-emerald-800/50 hover:text-white'}`}>
    <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: "spring", stiffness: 400 }}>{icon}</motion.div>
    <span className="font-semibold text-sm relative z-10">{label}</span>
    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
  </motion.div>
);

const StatCard = ({ title, value, icon, color, warning, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-50 hover:shadow-md transition-all flex items-center gap-4 ${warning ? 'border-red-200 bg-red-50/30' : ''} ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-95' : ''}`}
  >
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color}`}>{icon}</div>
    <div>
      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">{title}</p>
      <p className={`text-2xl font-black ${warning ? 'text-red-600' : 'text-gray-800'}`}>{value}</p>
    </div>
  </div>
);

export default AdminDashboard;