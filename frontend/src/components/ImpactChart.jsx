import { useState, useEffect, useMemo } from 'react';
import { 
  ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart 
} from 'recharts';
import { 
  TrendingUp, DollarSign, Users, Filter, ArrowUpRight, Target, 
  ChevronDown, ArrowRightLeft, Activity, Calendar
} from 'lucide-react';
import API from '../services/api';

const ImpactChart = ({ onBack }) => {
  const [activeView, setActiveView] = useState('growth'); 
  
  // FIX: Default to a wide range to ensure data visibility
  const [dateRange, setDateRange] = useState({
    start: '2023-01-01', 
    end: new Date().toISOString().split('T')[0] 
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user'));
  const canSeeFinance = ['SUPER_ADMIN', 'ADMIN', 'DEPT_ADMIN'].includes(user?.role);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await API.get('/analytics/impact', {
            params: { startDate: dateRange.start, endDate: dateRange.end }
        });
        
        // Ensure data is chart-ready
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

  if (loading) return <div className="h-full flex items-center justify-center text-gray-400 font-bold animate-pulse">Loading Analytics...</div>;

  return (
    <div className="h-full flex flex-col bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
      
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                {activeView === 'finance' ? <DollarSign size={18}/> : activeView === 'demographics' ? <Users size={18}/> : <TrendingUp size={18}/>}
            </div>
            {activeView === 'finance' ? 'Financials' : activeView === 'demographics' ? 'Demographics' : 'Impact Growth'}
          </h3>
          <p className="text-xs text-slate-400 font-medium ml-9">Real-time performance metrics</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
            {/* DATE PICKER */}
            <div className="flex items-center bg-slate-50 p-1.5 rounded-xl border border-slate-100 gap-2">
                <div className="flex items-center gap-2 px-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">From</span>
                    <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} className="py-1 text-xs font-bold text-slate-600 bg-transparent outline-none"/>
                </div>
                <div className="flex items-center gap-2 px-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To</span>
                    <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} className="py-1 text-xs font-bold text-slate-600 bg-transparent outline-none"/>
                </div>
            </div>

            <div className="w-px h-6 bg-slate-100 hidden sm:block"></div>

            {/* VIEW SELECTOR */}
            <div className="relative group">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-emerald-500 transition-colors" size={14} />
                <select value={activeView} onChange={(e) => setActiveView(e.target.value)} className="appearance-none pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 hover:border-emerald-200 hover:bg-white text-slate-600 text-xs font-bold rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer min-w-[140px]">
                    <option value="growth">Impact View</option>
                    {canSeeFinance && <option value="finance">Financial View</option>}
                    <option value="demographics">People View</option>
                </select>
            </div>

            {onBack && (
                <button onClick={onBack} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-500 text-xs font-bold rounded-xl hover:text-emerald-600 hover:border-emerald-200 hover:shadow-sm transition-all active:scale-95">
                    <ArrowRightLeft size={14} /> <span className="hidden sm:inline">Show Productivity</span>
                </button>
            )}
        </div>
      </div>

      {/* STATS CARD */}
      <div className="mb-6">
          {activeView === 'growth' ? (
             <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between group hover:border-emerald-100 transition-colors">
                <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 tracking-wider">{stats.label1}</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-black text-slate-800">{stats.val1}</p> 
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1"><TrendingUp size={10}/> Data for Selected Period</span>
                    </div>
                </div>
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm border border-slate-50 group-hover:scale-110 transition-transform">
                    <Activity size={24}/>
                </div>
             </div>
          ) : (
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-emerald-100 transition-colors">
                    <div><p className="text-[10px] text-slate-400 font-bold uppercase mb-1">{stats.label1}</p><p className="text-xl md:text-2xl font-black text-slate-800">{stats.val1}</p></div>
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center text-emerald-500 shadow-sm group-hover:scale-110 transition-transform"><ArrowUpRight size={16}/></div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-blue-100 transition-colors">
                    <div><p className="text-[10px] text-slate-400 font-bold uppercase mb-1">{stats.label2}</p><p className="text-xl md:text-2xl font-black text-slate-800">{stats.val2}</p></div>
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm group-hover:scale-110 transition-transform"><Target size={16}/></div>
                </div>
             </div>
          )}
      </div>

      {/* CHART AREA */}
      <div className="flex-1 w-full min-h-[350px] relative">
        {(!data || data.length === 0) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-white/50 backdrop-blur-sm z-10 rounded-2xl">
                <Activity size={32} className="mb-2 opacity-30"/>
                <p className="text-sm font-bold">No data found in this range.</p>
            </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          {activeView === 'growth' ? (
             // --- GROWTH CHART ---
             <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="impactGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 'bold'}} dy={10}/>
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11}} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '12px' }} />
                <Area type="monotone" dataKey="participants" stroke="#10B981" strokeWidth={3} fill="url(#impactGradient)" activeDot={{ r: 6 }} />
             </AreaChart>
          ) : (
             // --- FINANCE / DEMOGRAPHICS CHART ---
             <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="financeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 'bold'}} dy={10}/>
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11}} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#CBD5E1', fontSize: 11}} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '12px' }} />
                
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