import { useState, useEffect, useMemo } from 'react';
import { 
  ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart // ✅ Ensure this is imported
} from 'recharts';
import { 
  TrendingUp, DollarSign, Users, Filter, Target, 
  ChevronDown, ArrowRightLeft, Activity, ArrowUpRight
} from 'lucide-react';
import API from '../services/api';
import { useTheme } from '../context/ThemeContext';

const ImpactChart = ({ onBack }) => {
  const { theme } = useTheme(); 
  const [activeView, setActiveView] = useState('growth'); 
  
  const [dateRange, setDateRange] = useState({
    start: '2023-01-01', 
    end: new Date().toISOString().split('T')[0] 
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user'));
  const canSeeFinance = ['SUPER_ADMIN', 'ADMIN', 'DEPT_ADMIN'].includes(user?.role);

  const isDark = theme === 'dark';
  const axisColor = isDark ? '#9CA3AF' : '#94A3B8'; 
  const gridColor = isDark ? '#374151' : '#F1F5F9'; 
  const tooltipStyle = {
    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
    borderColor: isDark ? '#374151' : 'none',
    color: isDark ? '#F3F4F6' : '#1E293B',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    padding: '12px'
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await API.get('/analytics/impact', {
            params: { startDate: dateRange.start, endDate: dateRange.end }
        });
        
        const cleanData = data.map(item => ({
            name: item.name || item.date || 'Unknown', 
            participants: Number(item.participants) || 0,
            disbursed: Number(item.disbursed) || 0,
            programCount: Number(item.programCount) || 0,
            male: Number(item.male) || 0,
            female: Number(item.female) || 0,
        }));

        setData(cleanData);
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]); 

  const stats = useMemo(() => {
    if (!data.length) return { label1: 'Total Impacted', val1: '0' };
    
    const totalParticipants = data.reduce((a, b) => a + b.participants, 0);
    const totalDisbursed = data.reduce((a, b) => a + b.disbursed, 0);
    const totalPrograms = data.reduce((a, b) => a + b.programCount, 0);

    if (activeView === 'finance') {
        return {
            label1: "Total Disbursed", val1: `₦${totalDisbursed.toLocaleString()}`,
            label2: "Avg Cost / Program", val2: totalPrograms ? `₦${Math.round(totalDisbursed/totalPrograms).toLocaleString()}` : '₦0'
        };
    } else if (activeView === 'demographics') {
        const totalMale = data.reduce((a, b) => a + b.male, 0);
        const totalFemale = data.reduce((a, b) => a + b.female, 0);
        return {
            label1: "Male Attendance", val1: totalMale,
            label2: "Female Attendance", val2: totalFemale
        };
    } else {
        return {
            label1: "Total Impacted", val1: totalParticipants.toLocaleString(), 
        };
    }
  }, [data, activeView]);

  if (loading) return <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 font-bold animate-pulse">Loading Analytics...</div>;

  return (
    // ✅ FIX 1: Reduced padding for mobile (p-4) vs desktop (md:p-6)
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 p-4 md:p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-300">
      
      {/* HEADER - ✅ FIX 2: Better wrapping for mobile */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                {activeView === 'finance' ? <DollarSign size={18}/> : activeView === 'demographics' ? <Users size={18}/> : <TrendingUp size={18}/>}
            </div>
            {activeView === 'finance' ? 'Financials' : activeView === 'demographics' ? 'Demographics' : 'Impact Growth'}
          </h3>
          <p className="text-xs text-slate-400 dark:text-gray-500 font-medium ml-9">Real-time performance metrics</p>
        </div>

        {/* ✅ FIX 3: Allow wrapping and ensure full width on mobile */}
        <div className="flex items-center gap-2 flex-wrap w-full xl:w-auto">
            {/* DATE PICKER */}
            <div className="flex items-center bg-slate-50 dark:bg-gray-700/50 p-1.5 rounded-xl border border-slate-100 dark:border-gray-700 gap-2 overflow-x-auto max-w-full">
                <div className="flex items-center gap-2 px-2 bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-600 shadow-sm shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">From</span>
                    <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} className="py-1 text-xs font-bold text-slate-600 dark:text-gray-300 bg-transparent outline-none dark:[color-scheme:dark] w-24"/>
                </div>
                <div className="flex items-center gap-2 px-2 bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-600 shadow-sm shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">To</span>
                    <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} className="py-1 text-xs font-bold text-slate-600 dark:text-gray-300 bg-transparent outline-none dark:[color-scheme:dark] w-24"/>
                </div>
            </div>

            {/* VIEW SELECTOR */}
            <div className="relative group ml-auto">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={14} />
                <select value={activeView} onChange={(e) => setActiveView(e.target.value)} className="appearance-none pl-9 pr-4 py-2 bg-slate-50 dark:bg-gray-700/50 border border-slate-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-800 text-slate-600 dark:text-gray-200 text-xs font-bold rounded-xl outline-none transition-all cursor-pointer w-full">
                    <option value="growth">Impact</option>
                    {canSeeFinance && <option value="finance">Finance</option>}
                    <option value="demographics">People</option>
                </select>
            </div>
        </div>
      </div>

      {/* STATS CARD */}
      <div className="mb-6">
          {activeView === 'growth' ? (
             <div className="bg-slate-50 dark:bg-gray-900/50 p-6 rounded-3xl border border-slate-100 dark:border-gray-700 flex items-center justify-between">
                <div>
                    <p className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase mb-1 tracking-wider">{stats.label1}</p>
                    <div className="flex flex-wrap items-baseline gap-2">
                        <p className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white">{stats.val1}</p> 
                    </div>
                </div>
                <div className="w-12 h-12 md:w-14 md:h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-emerald-500 dark:text-emerald-400 shadow-sm border border-slate-50 dark:border-gray-700">
                    <Activity size={24}/>
                </div>
             </div>
          ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-slate-100 dark:border-gray-700 flex items-center justify-between">
                    <div><p className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase mb-1">{stats.label1}</p><p className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">{stats.val1}</p></div>
                    <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-emerald-500 dark:text-emerald-400 shadow-sm"><ArrowUpRight size={16}/></div>
                </div>
                <div className="bg-slate-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-slate-100 dark:border-gray-700 flex items-center justify-between">
                    <div><p className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase mb-1">{stats.label2}</p><p className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">{stats.val2}</p></div>
                    <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-blue-500 dark:text-blue-400 shadow-sm"><Target size={16}/></div>
                </div>
             </div>
          )}
      </div>

      {/* CHART AREA - ✅ FIX 4: Fixed height on mobile (300px), flex-1 on desktop */}
      <div className="w-full h-[300px] md:h-auto md:flex-1 relative">
        {(!data || data.length === 0) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-gray-500 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-10 rounded-2xl">
                <Activity size={32} className="mb-2 opacity-30"/>
                <p className="text-sm font-bold">No data found.</p>
            </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          {activeView === 'growth' ? (
             <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="impactGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: axisColor, fontSize: 10, fontWeight: 'bold'}} dy={10}/>
                <YAxis axisLine={false} tickLine={false} tick={{fill: axisColor, fontSize: 10}} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: isDark ? '#F3F4F6' : '#1E293B' }} />
                <Area type="monotone" dataKey="participants" stroke="#10B981" strokeWidth={3} fill="url(#impactGradient)" activeDot={{ r: 6 }} />
             </AreaChart>
          ) : (
             <ComposedChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="financeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: axisColor, fontSize: 10, fontWeight: 'bold'}} dy={10}/>
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: axisColor, fontSize: 10}} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: axisColor, fontSize: 10}} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: isDark ? '#F3F4F6' : '#1E293B' }} />
                
                {activeView === 'finance' && (
                  <>
                    <Area yAxisId="left" type="monotone" dataKey="disbursed" name="Funds (₦)" stroke="#3B82F6" strokeWidth={2} fill="url(#financeGradient)" />
                    <Line yAxisId="right" type="monotone" dataKey="programCount" name="Programs" stroke="#8B5CF6" strokeWidth={3} dot={{r: 4}} />
                  </>
                )}
                
                {activeView === 'demographics' && (
                  <>
                    <Bar yAxisId="left" dataKey="male" name="Male" stackId="a" fill="#3B82F6" barSize={30} radius={[0, 0, 4, 4]} />
                    <Bar yAxisId="left" dataKey="female" name="Female" stackId="a" fill="#EC4899" barSize={30} radius={[4, 4, 0, 0]} />
                  </>
                )}
             </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ImpactChart;