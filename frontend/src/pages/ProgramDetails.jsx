import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { 
  ArrowLeft, Calendar, User, FileText, Download, Edit2, Send, Clock, MapPin, 
  DollarSign, Activity, Sparkles, ChevronRight, Users, Mail, Share2, Copy, Check, 
  Lock, Unlock, CheckCircle, Layers, Plus, Hash, ArrowRight
} from 'lucide-react';
import EditProgramModal from '../components/EditProgramModal'; 
import ManageParticipantsModal from '../components/ManageParticipantsModal'; 
import CompleteProgramModal from '../components/CompleteProgramModal'; 
import AddProgramModal from '../components/AddProgramModal'; 

const BACKEND_URL = "http://localhost:5000"; 

const ProgramDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [reportText, setReportText] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false); 
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false); 

  const messagesEndRef = useRef(null);

  let user = {};
  try {
      const stored = localStorage.getItem('user');
      user = stored ? JSON.parse(stored) : {};
  } catch (e) { console.error("User parse error", e); }
  
  const fetchProgram = async () => {
    try {
      const { data } = await API.get(`/programs/${id}`);
      setData(data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProgram(); }, [id]);

  // --- HELPERS ---
  const safeFormatDate = (dateString) => {
    if (!dateString) return 'Date TBD';
    try {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'Date TBD' : date.toLocaleDateString(undefined, { dateStyle: 'long' });
    } catch (e) { return 'Invalid Date'; }
  };

  const safeFormatTime = (dateString) => {
      if (!dateString) return '';
      try {
          const date = new Date(dateString);
          return isNaN(date.getTime()) ? '' : date.toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute:'2-digit'});
      } catch (e) { return ''; }
  };

  const getSafeInputDate = (dateStr) => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 16);
    } catch (e) { return ''; }
  };

  const updateRegistrationSettings = async (updates) => {
      try { await API.put(`/programs/${id}`, updates); fetchProgram(); } 
      catch (err) { alert("Failed to update settings"); }
  };

  const handleAddReport = async (e) => {
    e.preventDefault();
    if(!reportText.trim()) return;
    try {
      await API.post(`/programs/${id}/updates`, { text: reportText });
      setReportText('');
      fetchProgram(); 
    } catch (err) { alert("Failed to add report"); }
  };

  // ✅ UPDATED: Robust link generation (Fallback to ID if slug is missing)
  const handleCopyLink = (slug) => {
    // If slug is available, use it. Otherwise, assume 'slug' passed is actually the ID or null
    const identifier = slug || program._id;
    
    // Check if identifier is an ID (no hyphens, 24 chars) or a Slug
    // We route everything through /register/program/ now to be safe
    const link = `${window.location.origin}/register/program/${identifier}`;
    
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-emerald-600 font-medium animate-pulse">Loading...</div>;
  if (!data) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500 font-bold">Program Not Found</div>;

  const program = data.program || data; 
  const children = data.children || []; 

  if (!program || !program._id) return <div className="p-8">Error: Invalid Program Data</div>;

  const isSeriesParent = program.structure === 'Recurring' || program.structure === 'Numerical';
  const isCreator = program?.createdBy?._id === user?._id || program?.createdBy === user?._id;
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'DEPT_ADMIN';
  const canEdit = isAdmin || (isCreator && program?.status !== 'Completed');
  const canComplete = (isAdmin || isCreator) && program?.status === 'Approved' && !isSeriesParent; 

  let imageUrl = 'none';
  if (program.flyer) {
    if (program.flyer.startsWith('http')) {
        imageUrl = program.flyer;
    } else {
        const cleanPath = program.flyer.replace(/\\/g, '/').replace(/^\//, '');
        imageUrl = `${BACKEND_URL}/${cleanPath}`;
    }
  }

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  // --- HERO SECTION ---
  const HeroSection = () => (
    <div className="relative w-full min-h-[400px] lg:min-h-[450px] flex flex-col justify-end overflow-hidden group z-10 bg-slate-900">
        <div className="absolute inset-0 bg-cover bg-center opacity-60 transition-transform duration-1000 group-hover:scale-105" style={{ backgroundImage: imageUrl !== 'none' ? `url('${imageUrl}')` : 'none' }}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/60 to-slate-900"></div>
        <div className="absolute top-0 w-full p-6 md:p-8 flex justify-between items-center z-30">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white text-sm font-medium transition-all">
                <ArrowLeft size={16} /> <span className="hidden md:inline">Back</span>
            </button>
            <div className="flex items-center gap-3">
                {canComplete && (
                    <button onClick={() => setIsCompleteModalOpen(true)} className="flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500 text-white hover:bg-emerald-400 font-bold shadow-lg transition-all">
                        <CheckCircle size={16}/> <span>Mark Complete</span>
                    </button>
                )}
                {canEdit && (
                  <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-2 px-5 py-2 rounded-full bg-white text-slate-900 hover:bg-emerald-50 font-bold shadow-lg transition-all">
                    <Edit2 size={16}/> <span>Edit</span>
                  </button>
                )}
            </div>
        </div>
        <div className="relative w-full p-6 md:p-12 pb-12 z-20 max-w-7xl mx-auto mt-20">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest border shadow-sm ${getStatusColor(program.status)}`}>{program.status}</span>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-white/10 border border-white/20 text-white backdrop-blur-md">{program.type}</span>
              {isSeriesParent && <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-blue-500/20 border border-blue-400/30 text-blue-100 backdrop-blur-md flex items-center gap-1">{program.structure === 'Recurring' ? <Layers size={10}/> : <Hash size={10}/>} {program.structure} Series</span>}
              {program.parentProgram && <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-purple-500/20 border border-purple-400/30 text-purple-100 backdrop-blur-md">Version of Series</span>}
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight drop-shadow-lg max-w-4xl">{program.name}</h1>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-sm font-medium text-slate-300 border-t border-white/10 pt-6">
              <div className="flex items-center gap-3 bg-white/5 pr-4 py-1.5 rounded-full backdrop-blur-sm"><div className="p-1.5 bg-white/10 rounded-full"><Calendar size={14} className="text-emerald-400"/></div><span>{safeFormatDate(program.date)}</span></div>
              <div className="flex items-center gap-3 bg-white/5 pr-4 py-1.5 rounded-full backdrop-blur-sm"><div className="p-1.5 bg-white/10 rounded-full"><MapPin size={14} className="text-emerald-400"/></div><span>{program.venue || 'No Venue'}</span></div>
            </div>
        </div>
    </div>
  );

  // VIEW 1: SERIES DASHBOARD
  if (isSeriesParent) {
    return (
        <div className="min-h-screen bg-gray-50 text-slate-800 font-sans animate-in fade-in">
            <HeroSection />
            <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-20 -mt-8 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 relative overflow-hidden">
                            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2"><FileText size={20} className="text-emerald-600"/> Series Overview</h3>
                            <p className="text-gray-600 leading-relaxed">{program.description || "No description provided."}</p>
                            {program.proposal && (
                                <a href={`${BACKEND_URL}/${program.proposal.replace(/\\/g, '/').replace(/^\//, '')}`} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-between p-4 rounded-xl bg-blue-50 border border-blue-100 hover:border-blue-300 transition-all cursor-pointer group">
                                    <div className="flex items-center gap-3"><div className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors"><Download size={20}/></div><div><p className="font-bold text-slate-800 text-sm">Download Proposal</p><p className="text-[10px] text-gray-500">Program documentation</p></div></div><ArrowRight size={18} className="text-blue-400 group-hover:translate-x-1 transition-transform"/>
                                </a>
                            )}
                        </div>
                        <div>
                            <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-6">
                                <div><h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">{program.structure === 'Recurring' ? <Layers size={22} className="text-emerald-600"/> : <Hash size={22} className="text-emerald-600"/>}{program.structure === 'Recurring' ? 'Active Versions' : 'Program Batches'}</h3><p className="text-sm text-gray-500">Manage individual instances.</p></div>
                                {canEdit && <button onClick={() => setIsVersionModalOpen(true)} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"><Plus size={18} /> {program.structure === 'Recurring' ? 'Create Next Version' : 'Start Next Batch'}</button>}
                            </div>
                            {children && children.length > 0 ? (
                                <div className="grid gap-4">
                                    {children.map((ver) => (
                                        <div key={ver._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center justify-between gap-4 group">
                                            <div className="flex-1"><h4 className="font-bold text-gray-800 text-lg group-hover:text-emerald-600 transition-colors">{ver.versionLabel || ver.customSuffix || ver.name}</h4><div className="flex items-center gap-4 text-xs font-bold text-gray-400 mt-1"><span className="flex items-center gap-1"><Calendar size={12}/> {new Date(ver.date).toLocaleDateString()}</span><span className="flex items-center gap-1"><Users size={12}/> {ver.participants?.length || 0} Registered</span><span className={`px-2 py-0.5 rounded ${ver.registration?.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{ver.registration?.isOpen ? 'Open' : 'Closed'}</span></div></div>
                                            <div className="flex items-center gap-3">
                                                {/* ✅ Use ID if LinkSlug missing */}
                                                <button onClick={() => handleCopyLink(ver.registration?.linkSlug || ver._id)} className="p-2 bg-gray-50 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200" title="Copy Link"><Copy size={16} /></button>
                                                <button onClick={() => navigate(`/programs/${ver._id}`)} className="px-4 py-2 bg-gray-100 text-gray-600 font-bold text-sm rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors flex items-center gap-2">Manage <ArrowRight size={14}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200"><Layers size={48} className="mx-auto text-gray-300 mb-4" /><h3 className="text-lg font-bold text-gray-500">No versions created yet.</h3><p className="text-sm text-gray-400">Click the button above to start.</p></div>
                            )}
                        </div>
                    </div>
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xl shadow-gray-200/50">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 pb-2 border-b border-gray-100">Series Stats</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 rounded-xl hover:bg-gray-50 transition-colors"><div className="flex items-center gap-3 text-gray-500"><Layers size={18}/><span className="text-sm font-medium">Total Versions</span></div><div className="text-right"><span className="font-bold text-slate-800 text-lg">{children.length}</span></div></div>
                                <div className="flex justify-between items-center p-3 rounded-xl hover:bg-gray-50 transition-colors"><div className="flex items-center gap-3 text-gray-500"><User size={18}/><span className="text-sm font-medium">Total Impact</span></div><div className="text-right"><span className="font-bold text-slate-800 text-lg">{children.reduce((acc, curr) => acc + (curr.participants?.length || 0), 0)}</span></div></div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 relative overflow-hidden text-white shadow-xl">
                            <div className="relative z-10 flex flex-col items-center text-center"><div className="w-20 h-20 mb-4 rounded-full border-4 border-white/20 bg-white/10 flex items-center justify-center text-2xl font-bold text-white shadow-lg backdrop-blur-md">{program.createdBy?.name ? program.createdBy.name[0] : <User/>}</div><h3 className="text-lg font-bold text-white mb-1">{program.createdBy?.name || 'Unknown Lead'}</h3><p className="text-xs text-emerald-100 uppercase tracking-widest mb-4">Program Lead</p><div className="w-full py-2 px-3 bg-white/10 rounded-lg border border-white/10"><p className="text-xs text-emerald-50">{program.createdBy?.email}</p></div></div>
                        </div>
                    </div>
                </div>
            </div>
            <AddProgramModal isOpen={isVersionModalOpen} onClose={() => setIsVersionModalOpen(false)} onSuccess={fetchProgram} parentProgram={program} />
            <EditProgramModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} program={program} onSuccess={fetchProgram}/>
        </div>
    );
  }

  // VIEW 2: SINGLE INSTANCE DASHBOARD
  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans">
      <HeroSection />
      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-20 -mt-0 lg:-mt-16 pb-20">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
               <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xl shadow-gray-200/50 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 text-emerald-600"><Sparkles size={100}/></div>
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3"><FileText className="text-emerald-600"/> Overview</h3>
                  {program.status === 'Completed' && program.finalReport && (
                      <div className="mb-6 p-6 bg-blue-50 border border-blue-100 rounded-2xl"><h4 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">Final Outcome</h4><p className="text-slate-700 text-sm leading-relaxed">{program.finalReport}</p></div>
                  )}
                  <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-sm md:text-base"><p className="whitespace-pre-wrap">{program.description || "No description available."}</p></div>
                  {program.proposal && (<a href={`${BACKEND_URL}/${program.proposal.replace(/\\/g, '/').replace(/^\//, '')}`} target="_blank" rel="noreferrer" className="mt-8 flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all cursor-pointer"><div className="flex items-center gap-4"><div className="w-10 h-10 flex items-center justify-center bg-emerald-100 rounded-lg text-emerald-600"><Download size={20}/></div><div><p className="font-bold text-slate-800 text-sm">Download Proposal</p></div></div><ChevronRight size={18} className="text-gray-400"/></a>)}
               </div>
               <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xl shadow-gray-200/50 flex flex-col h-[600px]">
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3"><Activity className="text-emerald-600"/> Live Updates</h3>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-6 relative custom-scrollbar">
                      <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-gray-100 min-h-full"></div>
                      {program.updates?.length === 0 ? <div className="text-center py-12 text-gray-400 italic text-sm">No updates yet.</div> : program.updates?.map((update, idx) => (<div key={idx} className="relative pl-10"><div className="absolute left-[3px] top-1.5 w-[18px] h-[18px] bg-white border-2 border-emerald-500 rounded-full z-10 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div></div><div className="flex flex-col sm:flex-row sm:justify-between gap-2 mb-2"><span className="font-bold text-slate-700 text-sm">{update.user?.name || 'System Admin'}</span><span className="text-[10px] font-bold uppercase text-gray-400">{safeFormatTime(update.date)}</span></div><div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-slate-600 text-sm">{update.text}</div></div>))}
                      <div ref={messagesEndRef} />
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100"><form onSubmit={handleAddReport} className="relative"><textarea className="w-full bg-gray-50 p-4 pr-14 rounded-2xl border border-gray-200 outline-none text-sm font-medium" rows="2" placeholder="Log a new update..." value={reportText} onChange={(e) => setReportText(e.target.value)}></textarea><button type="submit" disabled={!reportText.trim()} className="absolute bottom-3 right-3 w-10 h-10 flex items-center justify-center bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 disabled:opacity-50"><Send size={18} /></button></form></div>
               </div>
            </div>
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Share2 size={80}/></div>
                    <h4 className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-2">Public Registration</h4>
                    {canEdit && (<div className="mb-4 bg-black/20 rounded-xl p-3 border border-white/10 backdrop-blur-sm space-y-3"><div className="flex items-center justify-between"><span className="text-xs font-bold text-blue-100 flex items-center gap-2">{program.registration?.isOpen !== false ? <Unlock size={12}/> : <Lock size={12}/>}{program.registration?.isOpen !== false ? 'Registration OPEN' : 'Registration CLOSED'}</span><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={program.registration?.isOpen !== false} onChange={(e) => updateRegistrationSettings({ registrationOpen: e.target.checked })} className="sr-only peer" /><div className="w-9 h-5 bg-gray-600/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div></label></div><div className="pt-2 border-t border-white/10"><label className="text-[10px] font-bold text-blue-300 uppercase block mb-1">Auto-Close Deadline</label><input type="datetime-local" className="w-full bg-white/10 border border-white/20 rounded-lg p-1.5 text-xs text-white focus:outline-none" value={getSafeInputDate(program.registration?.deadline)} onChange={(e) => updateRegistrationSettings({ registrationDeadline: e.target.value || null })} /></div></div>)}
                    <div className="bg-black/20 rounded-xl p-3 flex items-center gap-3 border border-white/10 backdrop-blur-sm">
                        <div className="flex-1 min-w-0"><p className="text-xs text-blue-200 truncate font-mono select-all">{`${window.location.origin}/register/program/${program.registration?.linkSlug || program._id}`}</p></div>
                        {/* ✅ Use ID if LinkSlug missing */}
                        <button onClick={() => handleCopyLink(program.registration?.linkSlug || program._id)} className="p-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-bold text-xs">{copied ? <Check size={14}/> : <Copy size={14}/>}</button>
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xl shadow-gray-200/50">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 pb-2 border-b border-gray-100">Financials & Attendance</h4>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 rounded-xl hover:bg-gray-50 transition-colors"><div className="flex items-center gap-3 text-gray-500"><DollarSign size={18}/><span className="text-sm font-medium">Budget</span></div><div className="text-right"><span className="font-bold text-slate-800 font-mono text-lg">₦{program.cost?.toLocaleString() || '0.00'}</span>{program.amountDisbursed && (<p className="text-[10px] text-gray-400">Paid: ₦{program.amountDisbursed.toLocaleString()}</p>)}</div></div>
                        <div className="flex justify-between items-center p-3 rounded-xl hover:bg-gray-50 transition-colors"><div className="flex items-center gap-3 text-gray-500"><User size={18}/><span className="text-sm font-medium">Attendance</span></div><div className="text-right"><span className="font-bold text-slate-800 text-lg">{program.participants?.length || 0}</span><span className="text-xs text-gray-400 font-medium ml-1">/ {program.participantsCount || 0} Expected</span></div></div>
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xl shadow-gray-200/50">
                    <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-100"><h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Participants</h4>{canEdit && (<button onClick={() => setIsParticipantsModalOpen(true)} className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase hover:bg-emerald-100"><Users size={12}/> Manage</button>)}</div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                        {program.participants && program.participants.length > 0 ? (program.participants.map((person, idx) => { if (!person) return null; return (<div key={idx} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"><div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">{typeof person === 'object' ? (person.fullName || person.email || '?').charAt(0).toUpperCase() : '?'}</div><div className="min-w-0"><p className="text-xs font-bold text-gray-700 truncate">{typeof person === 'object' ? (person.fullName || person.email) : person}</p><p className="text-[10px] text-gray-400 flex items-center gap-1"><Mail size={8}/> Registered</p></div></div>); })) : (<div className="text-center py-6 text-gray-400 text-xs italic">No participants registered.</div>)}
                    </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 relative overflow-hidden text-white shadow-xl">
                    <div className="relative z-10 flex flex-col items-center text-center"><div className="w-20 h-20 mb-4 rounded-full border-4 border-white/20 bg-white/10 flex items-center justify-center text-2xl font-bold text-white shadow-lg backdrop-blur-md">{program.createdBy?.name ? program.createdBy.name[0] : <User/>}</div><h3 className="text-lg font-bold text-white mb-1">{program.createdBy?.name || 'Unknown Lead'}</h3><p className="text-xs text-emerald-100 uppercase tracking-widest mb-4">Program Lead</p><div className="w-full py-2 px-3 bg-white/10 rounded-lg border border-white/10"><p className="text-xs text-emerald-50">{program.createdBy?.email}</p></div></div>
                </div>
            </div>
         </div>
      </div>
      <EditProgramModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} program={program} onSuccess={fetchProgram}/>
      <ManageParticipantsModal isOpen={isParticipantsModalOpen} onClose={() => setIsParticipantsModalOpen(false)} program={program} onSuccess={fetchProgram} />
      <CompleteProgramModal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} program={program} onSuccess={fetchProgram}/>
    </div>
  );
};

export default ProgramDetails;