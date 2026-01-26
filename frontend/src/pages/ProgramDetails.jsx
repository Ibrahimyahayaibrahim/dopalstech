import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { 
  Users, Calendar, CheckCircle, Clock, Link as LinkIcon, 
  ArrowLeft, Download, Edit3, Layers, 
  ExternalLink, Copy, ChevronRight,
  MessageSquare, Plus, ShieldAlert,
  ToggleLeft, ToggleRight, Settings,
  TrendingUp
} from 'lucide-react';

// ✅ IMPORT UI CONTEXT
import { useUI } from '../context/UIContext';

// ✅ IMPORT LOADER
import Loader from '../components/Loader';

// Modals
import AddProgramModal from '../components/AddProgramModal'; 
import EditProgramModal from '../components/EditProgramModal'; 
import CompleteProgramModal from '../components/CompleteProgramModal'; 
import ManageParticipantsModal from '../components/ManageParticipantsModal'; 

const ProgramDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // ✅ Hook into UI
  const { showToast, confirmAction } = useUI();
  
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState({});
  
  // Modal States
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false); 

  // Chat State
  const [updateText, setUpdateText] = useState('');
  const [sendingUpdate, setSendingUpdate] = useState(false);
  const [regDate, setRegDate] = useState('');

  const fetchProgram = async () => {
    try {
      // Keep loading true initially or handles re-fetching silently? 
      // Usually keep loading true only on first load.
      if(!program) setLoading(true);
      
      const { data } = await API.get(`/programs/${id}`);
      setProgram(data);
      if(data.registration?.deadline) {
          setRegDate(new Date(data.registration.deadline).toISOString().split('T')[0]);
      }
    } catch (error) { 
        console.error(error);
        showToast("Failed to load program details.", "error"); 
    } finally { 
        setLoading(false); 
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user')) || {};
    setCurrentUser(user);
    fetchProgram();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // --- LOGIC: MASTER vs INSTANCE ---
  const isMaster = useMemo(() => {
      if (!program) return false;
      return (!program.parentProgram && (program.structure === 'Recurring' || program.structure === 'Numerical')) 
             || (program.children && program.children.length > 0);
  }, [program]);

  // Calculate Aggregated Stats for Master
  const masterStats = useMemo(() => {
      if (!program || !program.children) return { totalBeneficiaries: 0, totalBatches: 0, avgAttendance: 0 };
      const totalBeneficiaries = program.children.reduce((acc, child) => acc + (child.participants?.length || 0), 0);
      const totalBatches = program.children.length;
      return {
          totalBeneficiaries,
          totalBatches,
          avgAttendance: totalBatches > 0 ? Math.round(totalBeneficiaries / totalBatches) : 0
      };
  }, [program]);

  const canManage = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';

  const copyLink = () => {
    const url = `${window.location.origin}/register/${program.registration.linkSlug}`;
    navigator.clipboard.writeText(url);
    showToast("Registration link copied to clipboard!", "success");
  };

  // --- HANDLERS (UPDATED) ---
  const handleToggleRegistration = async () => {
      if(!canManage) return;
      try {
          await API.put(`/programs/${id}`, { registrationOpen: !program.registration.isOpen });
          showToast(`Registration ${!program.registration.isOpen ? 'Opened' : 'Closed'}`, "success");
          fetchProgram(); 
      } catch (error) { showToast("Failed to update status.", "error"); }
  };

  const handleDateChange = async (e) => {
      if(!canManage) return;
      try { 
          await API.put(`/programs/${id}`, { registrationDeadline: e.target.value }); 
          setRegDate(e.target.value);
          showToast("Deadline updated.", "success");
      } catch (error) { showToast("Failed to update deadline.", "error"); }
  };

  const handlePostUpdate = async () => {
      if(!updateText.trim()) return;
      setSendingUpdate(true);
      try {
          await API.post(`/programs/${id}/updates`, { text: updateText });
          setUpdateText('');
          showToast("Update posted successfully.", "success");
          fetchProgram();
      } catch (error) { showToast("Failed to post update.", "error"); } 
      finally { setSendingUpdate(false); }
  };

  const handleStatusChange = async (newStatus) => {
      if(!canManage) return;
      
      const confirmed = await confirmAction(
          `Are you sure you want to change status to ${newStatus}?`,
          "Update Status",
          { confirmText: "Yes, Update", type: "info" }
      );

      if (!confirmed) return;

      try {
          await API.put(`/programs/${id}/status`, { status: newStatus });
          showToast(`Status updated to ${newStatus}`, "success");
          fetchProgram();
      } catch (error) { showToast("Failed to update status.", "error"); }
  };

  if (loading) return <Loader text="Loading Program..." />;
  if (!program) return <div className="p-10 text-center text-red-500">Program Not Found</div>;

  const bgImage = program.flyer 
    ? `url(http://localhost:5000/${program.flyer.replace(/\\/g, '/')})` 
    : 'linear-gradient(to right, #059669, #10b981)';

  // ==================================================================================
  // VIEW 1: MASTER PROGRAM DASHBOARD (Blueprint)
  // ==================================================================================
  const renderMasterView = () => (
    <div className="space-y-8">
        
        {/* 1. MASTER HEADER CARD */}
        <div className="rounded-[2rem] shadow-xl border border-gray-200 overflow-hidden relative text-white min-h-[220px] flex items-end"
             style={{ backgroundImage: bgImage, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
            <div className="relative z-10 p-8 w-full flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="bg-purple-500/90 backdrop-blur-sm text-white border border-purple-400/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                            <Layers size={12}/> Master Program
                        </span>
                    </div>
                    <h1 className="text-4xl font-extrabold mb-2 shadow-sm text-white">{program.name}</h1>
                    <p className="text-gray-300 font-medium">{program.department?.name || 'Department'}</p>
                </div>
                {canManage && (
                    <button onClick={() => setIsEditModalOpen(true)} className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-white/30 transition-all">
                        <Edit3 size={18}/> Edit Details
                    </button>
                )}
            </div>
        </div>

        {/* 2. ANALYTICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <Layers size={24}/>
                </div>
                <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Batches</p>
                    <p className="text-2xl font-extrabold text-gray-800">{masterStats.totalBatches}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Users size={24}/>
                </div>
                <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Beneficiaries</p>
                    <p className="text-2xl font-extrabold text-gray-800">{masterStats.totalBeneficiaries}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <TrendingUp size={24}/>
                </div>
                <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Avg. Class Size</p>
                    <p className="text-2xl font-extrabold text-gray-800">{masterStats.avgAttendance}</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 3. LEFT COL: DESCRIPTION & VERSIONS */}
            <div className="lg:col-span-2 space-y-8">
                {/* About */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 text-lg">About the Program</h3>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">{program.description || "No description provided."}</p>
                </div>

                {/* VERSION HISTORY LIST */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                            <Clock size={20} className="text-purple-500"/>
                            {program.structure === 'Numerical' ? 'Batches History' : 'Version History'}
                        </h3>
                        {canManage && (
                            <button onClick={() => setIsVersionModalOpen(true)} className="text-xs font-bold bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 flex items-center gap-2 shadow-lg shadow-purple-200 transition-all">
                                <Plus size={16}/> Create Next Batch
                            </button>
                        )}
                    </div>
                    
                    <div className="space-y-3">
                        {program.children?.length > 0 ? (
                            program.children.map(child => (
                                <div key={child._id} onClick={() => navigate(`/programs/${child._id}`)} className="p-4 rounded-2xl border border-gray-100 hover:border-purple-300 hover:bg-purple-50/50 transition-all cursor-pointer flex justify-between items-center bg-gray-50 group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-500 text-xs">
                                            {program.structure === 'Numerical' ? `#${child.batchNumber || '?'}` : <Calendar size={14}/>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-700 group-hover:text-purple-700 transition-colors">{child.customSuffix || child.name}</p>
                                            <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                                                <span>{new Date(child.date).toLocaleDateString()}</span>
                                                <span>•</span>
                                                <span>{child.participants?.length || 0} Beneficiaries</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${child.status === 'Completed' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {child.status}
                                        </span>
                                        <ChevronRight size={18} className="text-gray-300 group-hover:text-purple-400"/>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-2xl">
                                <p className="text-gray-400 font-bold">No versions created yet.</p>
                                <p className="text-gray-300 text-sm mt-1">Start by creating the first batch.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 4. RIGHT COL: CHAT & DOCS */}
            <div className="space-y-6">
                
                {/* UPDATES / CHAT */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                        <MessageSquare size={20} className="text-indigo-500"/> Team Updates
                    </h3>
                    <div className="space-y-6 pl-4 border-l-2 border-gray-100 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {program.updates?.length > 0 ? (
                            program.updates.slice().reverse().map((update, idx) => (
                                <div key={idx} className="relative pl-6">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 border-4 border-white shadow-sm"></div>
                                    <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg rounded-tl-none border border-gray-100">{update.text}</p>
                                    <p className="text-[10px] text-gray-400 mt-1 font-bold">{new Date(update.date).toLocaleString()} • {update.user?.name || 'Admin'}</p>
                                </div>
                            ))
                        ) : <p className="text-sm text-gray-400 italic pl-6">No updates posted yet.</p>}
                    </div>
                    {canManage && (
                        <div className="flex gap-2 bg-gray-50 p-2 rounded-xl border focus-within:border-indigo-400 transition-all">
                            <textarea className="w-full bg-transparent p-2 text-sm outline-none resize-none" rows="1" placeholder="Post an update..." value={updateText} onChange={(e) => setUpdateText(e.target.value)} />
                            <button onClick={handlePostUpdate} disabled={sendingUpdate || !updateText.trim()} className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                {sendingUpdate ? <Clock size={16} className="animate-spin"/> : <ArrowLeft size={16} className="rotate-90"/>}
                            </button>
                        </div>
                    )}
                </div>

                {/* DOCUMENTS */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Download size={18} className="text-gray-400"/> Documents</h3>
                    <div className="space-y-2">
                        {program.proposal ? (
                            <a href={`http://localhost:5000/${program.proposal}`} target="_blank" className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100 hover:bg-purple-100 transition-colors">
                                <LinkIcon size={14} className="text-purple-600"/>
                                <span className="text-xs font-bold text-purple-700 truncate">Proposal</span>
                            </a>
                        ) : <p className="text-xs text-gray-400 italic">No proposal uploaded.</p>}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );

  // ==================================================================================
  // VIEW 2: INSTANCE / VERSION VIEW (The Actual Event)
  // ==================================================================================
  const renderVersionView = () => (
    <div className="space-y-8 animate-in fade-in">
        
        {/* HERO CARD */}
        <div className="rounded-[2rem] shadow-xl border border-gray-200 overflow-hidden relative text-white min-h-[300px] flex items-end"
             style={{ backgroundImage: bgImage, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent"></div>
            <div className="relative z-10 p-8 w-full flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        {program.customSuffix && (
                            <span className="bg-white/20 backdrop-blur-md text-white border border-white/30 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                {program.customSuffix}
                            </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${program.status === 'Completed' ? 'bg-blue-500 border-blue-400' : 'bg-emerald-500 border-emerald-400'}`}>
                            {program.status}
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold mb-2 shadow-sm">{program.name}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-200">
                        <span className="flex items-center gap-1"><Calendar size={16}/> {new Date(program.date).toDateString()}</span>
                        {program.venue && <span className="flex items-center gap-1"><ExternalLink size={16}/> {program.venue}</span>}
                    </div>
                </div>
                
                <div className="flex flex-col gap-2 w-full md:w-auto">
                    <button onClick={copyLink} className="bg-white text-gray-900 px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 shadow-lg transition-all">
                        <Copy size={18}/> Copy Reg. Link
                    </button>
                    {canManage && (
                        <button onClick={() => setIsEditModalOpen(true)} className="bg-white/10 backdrop-blur-md border border-white/30 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-all">
                            <Edit3 size={18}/> Edit
                        </button>
                    )}
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN */}
            <div className="md:col-span-2 space-y-8">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-2 text-lg">Details</h3>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">{program.description || "No description."}</p>
                </div>

                {/* PARTICIPANTS LIST */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                            <Users size={20} className="text-emerald-600"/> 
                            Beneficiaries <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">{program.participants?.length || 0}</span>
                        </h3>
                        {canManage && (
                            <button onClick={() => setIsParticipantModalOpen(true)} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 flex items-center gap-1">
                                <Settings size={14}/> Manage
                            </button>
                        )}
                    </div>
                    {program.participants?.length > 0 ? (
                        <div className="space-y-3">
                            {program.participants.slice(0, 5).map((p, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-sm">
                                            {p.fullName?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{p.fullName}</p>
                                            <p className="text-xs text-gray-400">{p.email}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                                </div>
                            ))}
                            {program.participants.length > 5 && <button onClick={() => setIsParticipantModalOpen(true)} className="w-full text-sm text-emerald-600 font-bold py-2">View All</button>}
                        </div>
                    ) : <p className="text-gray-400 text-sm italic text-center py-4">No registrations yet.</p>}
                </div>

                {/* UPDATES */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg"><MessageSquare size={20} className="text-indigo-500"/> Updates</h3>
                    <div className="space-y-4 pl-4 border-l-2 border-gray-100">
                        {program.updates?.length > 0 ? (
                            program.updates.slice().reverse().map((update, idx) => (
                                <div key={idx} className="relative pl-6">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 border-4 border-white shadow-sm"></div>
                                    <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">{update.text}</p>
                                </div>
                            ))
                        ) : <p className="text-gray-400 italic pl-6 text-sm">No updates.</p>}
                    </div>
                    {canManage && (
                        <div className="flex gap-2 mt-4">
                            <input className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Post update..." value={updateText} onChange={(e) => setUpdateText(e.target.value)} />
                            <button onClick={handlePostUpdate} disabled={sendingUpdate} className="bg-indigo-600 text-white px-4 rounded-lg text-sm font-bold">Post</button>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: CONTROLS */}
            <div className="md:col-span-1 space-y-6">
                {canManage && (
                    <>
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><ShieldAlert size={18} className="text-orange-500"/> Registration</h3>
                            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-xl">
                                <span className={`text-xs font-bold uppercase ${program.registration.isOpen ? 'text-emerald-600' : 'text-red-500'}`}>{program.registration.isOpen ? 'Open' : 'Closed'}</span>
                                <button onClick={handleToggleRegistration}>
                                    {program.registration.isOpen ? <ToggleRight size={32} className="text-emerald-500 fill-emerald-100"/> : <ToggleLeft size={32} className="text-gray-300"/>}
                                </button>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Close Date</label>
                                <input type="date" value={regDate} onChange={handleDateChange} className="w-full p-2 text-sm font-bold text-gray-700 border border-gray-200 rounded-lg outline-none focus:border-emerald-500"/>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><CheckCircle size={18} className="text-emerald-500"/> Status</h3>
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {['Pending', 'Approved', 'Ongoing', 'Completed'].map(status => (
                                    <button key={status} onClick={() => handleStatusChange(status)} className={`text-xs font-bold py-2 rounded-lg border transition-all ${program.status === status ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-gray-500 border-gray-100'}`}>{status}</button>
                                ))}
                            </div>
                            {program.status !== 'Completed' && (
                                <button onClick={() => setIsCompleteModalOpen(true)} className="w-full py-2.5 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-black flex items-center justify-center gap-2 transition-all">
                                    <CheckCircle size={14}/> Mark as Complete
                                </button>
                            )}
                        </div>
                    </>
                )}

                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Download size={18} className="text-purple-500"/> Documents</h3>
                    <div className="space-y-2">
                        {program.proposal ? (
                            <a href={`http://localhost:5000/${program.proposal}`} target="_blank" className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100 hover:bg-purple-100 transition-colors"><LinkIcon size={14} className="text-purple-600"/><span className="text-xs font-bold text-purple-700 truncate">Proposal</span></a>
                        ) : <p className="text-xs text-gray-400 italic pl-2">No proposal.</p>}
                        {program.flyer && (
                            <a href={`http://localhost:5000/${program.flyer}`} target="_blank" className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100 hover:bg-orange-100 transition-colors"><LinkIcon size={14} className="text-orange-600"/><span className="text-xs font-bold text-orange-700 truncate">Flyer</span></a>
                        )}
                    </div>
                </div>

                {program.status === 'Completed' && (
                    <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100 animate-in zoom-in">
                        <h3 className="font-bold text-emerald-800 mb-2 flex items-center gap-2"><CheckCircle size={18}/> Completed</h3>
                        <div className="space-y-2 text-xs text-emerald-700">
                            <p><strong>Beneficiaries:</strong> {program.actualAttendance || 0}</p>
                            {program.driveLink && <a href={program.driveLink} target="_blank" className="block text-emerald-600 underline">View Photos</a>}
                            {program.finalDocument && <a href={`http://localhost:5000/${program.finalDocument}`} target="_blank" className="block text-emerald-600 underline">View Report</a>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen font-sans animate-in fade-in pb-20">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 font-bold transition-colors">
            <ArrowLeft size={18} /> Back
        </button>
        {program.parentProgram && (
             <button onClick={() => navigate(`/programs/${program.parentProgram}`)} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-2 transition-colors">
                <Layers size={14}/> Master Program
             </button>
        )}
      </div>

      {/* RENDER THE CORRECT VIEW BASED ON TYPE */}
      {isMaster ? renderMasterView() : renderVersionView()}

      {/* SHARED MODALS */}
      <AddProgramModal isOpen={isVersionModalOpen} onClose={() => setIsVersionModalOpen(false)} parentProgram={program} onSuccess={fetchProgram} />
      <EditProgramModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} program={program} onSuccess={fetchProgram} />
      <CompleteProgramModal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} program={program} onSuccess={fetchProgram} />
      <ManageParticipantsModal isOpen={isParticipantModalOpen} onClose={() => setIsParticipantModalOpen(false)} program={program} onSuccess={fetchProgram} />
    </div>
  );
};

export default ProgramDetails;