import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../services/api';
import { 
  BarChart3, Users, Download, Briefcase, Activity, 
  Loader2, CheckCircle, Clock, Layers, Building2, User
} from 'lucide-react';

// --- IMPORT THE CHART COMPONENT ---
import ImpactChart from './ImpactChart';

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"; 

const GlobalReports = () => {
  const { state } = useLocation(); 
  const [activeTab, setActiveTab] = useState('programs');
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [stats, setStats] = useState(null);
  const [deptStats, setDeptStats] = useState([]);
  const [activities, setActivities] = useState([]); 

  // User State
  const user = JSON.parse(localStorage.getItem('user'));
  const isStaff = user?.role === 'STAFF';

  // Auto-switch tab based on Dashboard click
  useEffect(() => {
      if (state?.view) {
          setActiveTab(state.view);
      }
  }, [state]);

  useEffect(() => {
    const fetchData = async () => {
        try {
            // 1. Always fetch Stats
            const [globalRes, deptRes] = await Promise.all([
                API.get('/reports/global'),
                API.get('/reports/departments')
            ]);
            setStats(globalRes.data);
            setDeptStats(deptRes.data);

            // 2. Fetch Activities ONLY if NOT Staff
            if (!isStaff) {
                const activityRes = await API.get('/activities');
                setActivities(activityRes.data);
            }

        } catch (err) {
            console.error("Failed to load reports", err);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [isStaff]);

  const handlePrint = () => window.print();

  // Helper for images
  const getProfileImage = (path) => {
    if (!path) return null;
    if (path.startsWith('blob:')) return path; 
    if (path.startsWith('http')) return path;  
    return `${BACKEND_URL}${path}`; 
  };

  if (loading) return (
      <div className="flex flex-col items-center justify-center h-96 text-emerald-600 animate-pulse">
          <Loader2 size={48} className="animate-spin mb-4"/>
          <p className="font-bold">Generating Intelligence Report...</p>
      </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-enter pb-20 print:p-0">
      
      {/* HEADER */}
      <div className="flex justify-between items-end print:hidden">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <BarChart3 className="text-emerald-600"/> {isStaff ? "Performance Reports" : "System Intelligence"}
            </h2>
            <p className="text-gray-500 text-sm">
                {isStaff ? "Your departmental breakdown & impact." : "Real-time system activity & audit logs."}
            </p>
          </div>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm">
              <Download size={16}/> Export PDF
          </button>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex gap-2 border-b border-gray-100 overflow-x-auto print:hidden">
        <TabButton id="programs" label="Programs" icon={<Layers size={16}/>} active={activeTab} onClick={setActiveTab}/>
            <TabButton id="departments" label="Departments" icon={<Briefcase size={16}/>} active={activeTab} onClick={setActiveTab}/>
           <TabButton id="impact" label="Impact" icon={<Users size={16}/>} active={activeTab} onClick={setActiveTab}/>
         <TabButton id="overview" label={isStaff ? "Overview" : "Activity Feed"} icon={<Activity size={16}/>} active={activeTab} onClick={setActiveTab}/>
      </div>
    
    {/* --- VIEW 3: PROGRAMS BREAKDOWN --- */}
      {(activeTab === 'programs' || activeTab === 'pending') && (
          <div className="space-y-6 animate-enter">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <StatusCard label="Total Created" value={stats?.overview?.totalPrograms} color="bg-gray-100 text-gray-600"/>
                  <StatusCard label="Active / Ongoing" value={stats?.overview?.activePrograms} color="bg-emerald-100 text-emerald-700"/>
                  <StatusCard label="Completed" value={stats?.overview?.completedPrograms} color="bg-blue-100 text-blue-700"/>
                  <StatusCard label="Pending Approval" value={stats?.overview?.pendingApprovals} color="bg-amber-100 text-amber-700"/>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-6">Programs by Type</h3>
                  <div className="space-y-4">
                      {stats?.breakdowns?.types?.map((type, idx) => (
                          <div key={idx} className="flex items-center gap-4">
                              <span className="w-32 text-sm font-bold text-gray-500">{type.name || 'Unspecified'}</span>
                              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(type.value / stats.overview.totalPrograms) * 100}%` }}></div>
                              </div>
                              <span className="w-10 text-right font-bold text-gray-700">{type.value}</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* --- VIEW 1: OVERVIEW (Split Logic) --- */}
      {activeTab === 'overview' && (
          <div className="animate-enter">
              {!isStaff ? (
                  // ✅ ADMIN VIEW: ACTIVITY FEED
                  <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                      <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">Live System Activity</h3>
                            <p className="text-gray-500 text-xs mt-1">Real-time audit log of all actions within your jurisdiction.</p>
                          </div>
                          <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                              Live
                          </div>
                      </div>
                      <div className="p-8">
                        {activities.length > 0 ? (
                            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                                {activities.map((log) => (
                                    <div key={log._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        
                                        {/* Icon Dot */}
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                            {log.action.includes('LOGIN') ? <User size={16} className="text-blue-500"/> :
                                             log.action.includes('CREATE') ? <Layers size={16} className="text-emerald-500"/> :
                                             log.action.includes('COMPLETE') ? <CheckCircle size={16} className="text-purple-500"/> :
                                             <Activity size={16} className="text-gray-400"/>}
                                        </div>
                                        
                                        {/* Content Card */}
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center justify-between space-x-2 mb-2">
                                                <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                                    {log.user?.profilePicture && (
                                                        <img src={getProfileImage(log.user.profilePicture)} className="w-6 h-6 rounded-full object-cover border border-gray-100" alt=""/>
                                                    )}
                                                    {log.user?.name || 'Unknown User'}
                                                </div>
                                                <time className="font-mono text-[10px] text-gray-400 font-bold">{new Date(log.createdAt).toLocaleString()}</time>
                                            </div>
                                            <div className="text-gray-600 text-sm mb-2">{log.description}</div>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="bg-gray-50 text-gray-500 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-gray-100">
                                                    {log.action.replace(/_/g, ' ')}
                                                </span>
                                                {log.department && (
                                                    <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                                                        {log.department.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 text-gray-400">
                                <Activity size={48} className="mx-auto mb-4 opacity-20"/>
                                <p>No activity recorded yet.</p>
                            </div>
                        )}
                      </div>
                  </div>
              ) : (
                  // ✅ STAFF VIEW: STATS OVERVIEW
                  <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <ReportCard label="My Department" value={user?.departments?.[0]?.name || 'General'} icon={<Building2 size={24}/>} color="text-blue-600" bg="bg-blue-50"/>
                          <ReportCard label="Total Programs" value={deptStats.find(d => user.departments?.some(ud => (ud._id||ud) === d._id))?.programCount || 0} icon={<Briefcase size={24}/>} color="text-purple-600" bg="bg-purple-50"/>
                          <ReportCard label="Active Now" value={deptStats.find(d => user.departments?.some(ud => (ud._id||ud) === d._id))?.activePrograms || 0} icon={<Activity size={24}/>} color="text-emerald-600" bg="bg-emerald-50"/>
                      </div>
                      <DepartmentTable deptStats={deptStats} />
                  </div>
              )}
          </div>
      )}

      {/* --- VIEW 2: DEPARTMENTS --- */}
      {activeTab === 'departments' && (
          <div className="animate-enter">
              <DepartmentTable deptStats={deptStats} />
          </div>
      )}

      

      {/* --- VIEW 4: IMPACT ANALYSIS (UPDATED WITH GRAPH) --- */}
      {activeTab === 'impact' && (
          <div className="animate-enter h-[600px] w-full">
              {/* This renders your new complex chart in full size */}
              <ImpactChart />
          </div>
      )}

    </div>
  );
};

// --- SUB COMPONENTS ---
const TabButton = ({ id, label, icon, active, onClick }) => (
    <button 
        onClick={() => onClick(id)}
        className={`flex items-center gap-2 px-6 py-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${active === id ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
    >
        {icon} {label}
    </button>
);

const ReportCard = ({ label, value, sub, icon, color, bg }) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
        <div className={`absolute top-0 right-0 p-4 ${color} opacity-10`}>{icon}</div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg} ${color} mb-4`}>{icon}</div>
        <h3 className="text-3xl font-extrabold text-gray-800 tracking-tight">{value}</h3>
        <p className="text-sm font-bold text-gray-500 mt-1">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-1 font-medium">{sub}</p>}
    </div>
);

const StatusCard = ({ label, value, color }) => (
    <div className={`p-6 rounded-2xl border border-transparent ${color} text-center`}>
        <h3 className="text-3xl font-extrabold mb-1">{value}</h3>
        <p className="text-xs font-bold uppercase tracking-wide opacity-80">{label}</p>
    </div>
);

const DepartmentTable = ({ deptStats }) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-6">Department Breakdown</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[10px]">
                    <tr>
                        <th className="p-4 rounded-l-xl">Department Name</th>
                        <th className="p-4">Staff Count</th>
                        <th className="p-4">Total Programs</th>
                        <th className="p-4">Active Now</th>
                        <th className="p-4 rounded-r-xl text-right">Total Impact</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {deptStats.map((dept, idx) => (
                        <tr key={idx} className="group hover:bg-gray-50/50">
                            <td className="p-4 font-bold text-gray-700">{dept.name}</td>
                            <td className="p-4 text-gray-500">{dept.staffCount} Staff</td>
                            <td className="p-4 text-gray-500">{dept.programCount}</td>
                            <td className="p-4 text-emerald-600 font-bold">{dept.activePrograms}</td>
                            <td className="p-4 text-right font-bold text-gray-700">{dept.impact?.toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export default GlobalReports;