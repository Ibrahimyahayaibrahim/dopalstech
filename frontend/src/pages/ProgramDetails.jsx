import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import EmojiPicker from 'emoji-picker-react'; 
import { 
  Users, Calendar, CheckCircle, Clock, Link as LinkIcon, 
  ArrowLeft, Download, Edit3, Layers, 
  ExternalLink, Copy, ChevronRight,
  MessageSquare, Plus, ShieldAlert,
  ToggleLeft, ToggleRight, Settings, Smile 
} from 'lucide-react';

// Modals
import AddProgramModal from '../components/AddProgramModal'; 
import EditProgramModal from '../components/EditProgramModal'; 
import CompleteProgramModal from '../components/CompleteProgramModal'; 
import ManageParticipantsModal from '../components/ManageParticipantsModal'; 

// --- HELPER: DATE FORMATTING FOR CHAT ---
const getChatDateLabel = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === now.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

// --- ✅ NEW HELPER: HANDLE CLOUDINARY VS LOCAL FILES ---
const getFileUrl = (filePath) => {
  if (!filePath) return '';
  // If it's a Cloudinary URL (starts with http/https), return as is
  if (filePath.startsWith('http')) return filePath;
  // If it's a local file, append the localhost URL (and fix windows backslashes)
  return `http://localhost:5000/${filePath.replace(/\\/g, '/')}`;
};

const ProgramDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // User Role Check
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Auto-Scroll Ref
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const onEmojiClick = (emojiObject) => {
    setUpdateText(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false); 
  };

  // --- 1. FETCH DATA ---
  const fetchProgram = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const { data } = await API.get(`/programs/${id}`);
      setProgram(data);
      if(data.registration?.deadline) {
          setRegDate(new Date(data.registration.deadline).toISOString().split('T')[0]);
      }
      
      if (!isBackground) {
          setTimeout(scrollToBottom, 200); 
      }

    } catch (error) {
      console.error("Failed to load program", error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user')) || {};
    setCurrentUser(user);
    fetchProgram(); 
  }, [id]);

  useEffect(() => {
      const interval = setInterval(() => {
          fetchProgram(true); 
      }, 5000); 
      return () => clearInterval(interval);
  }, [id]);

  // --- 2. PERMISSIONS LOGIC ---
  const canManage = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';
  const canChat = canManage || currentUser.role === 'STAFF';

  // --- 3. HANDLERS ---
  const copyLink = () => {
    // 1. Priority: Use the "Live" URL defined in .env
    // 2. Fallback: Use the current browser URL (window.location.origin)
    const baseUrl = import.meta.env.VITE_CLIENT_URL || window.location.origin;
    
    const url = `${baseUrl}/register/${program.registration.linkSlug}`;
    
    navigator.clipboard.writeText(url);
    alert("Registration link copied to clipboard!");
  };

  const handleToggleRegistration = async () => {
      if(!canManage) return;
      try {
          const newState = !program.registration.isOpen;
          await API.put(`/programs/${id}`, { registrationOpen: newState });
          fetchProgram(); 
      } catch (error) { alert("Failed to toggle registration."); }
  };

  const handleDateChange = async (e) => {
      if(!canManage) return;
      const newDate = e.target.value;
      setRegDate(newDate);
      try { await API.put(`/programs/${id}`, { registrationDeadline: newDate }); } 
      catch (error) { alert("Failed to update deadline."); }
  };

  const handlePostUpdate = async () => {
      if(!updateText.trim()) return;
      setSendingUpdate(true);
      try {
          await API.post(`/programs/${id}/updates`, { text: updateText });
          setUpdateText('');
          fetchProgram(true); 
          setTimeout(scrollToBottom, 100);
      } catch (error) { alert("Failed to post update."); } 
      finally { setSendingUpdate(false); }
  };

  const handleStatusChange = async (newStatus) => {
      if(!canManage) return;
      if(!window.confirm(`Change status to ${newStatus}?`)) return;
      try {
          await API.put(`/programs/${id}/status`, { status: newStatus });
          fetchProgram();
      } catch (error) { alert("Failed to update status."); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-emerald-600 font-bold">Loading...</div>;
  if (!program) return <div className="p-10 text-center text-red-500">Program not found</div>;

  const isParent = !program.parentProgram && program.structure !== 'One-Time';
  const isChild = !!program.parentProgram;
  
  // ✅ FIX 1: HERO IMAGE URL
  const bgImage = program.flyer 
    ? `url(${getFileUrl(program.flyer)})` 
    : 'linear-gradient(to right, #059669, #10b981)';

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen font-sans animate-in fade-in pb-20">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 font-bold transition-colors">
            <ArrowLeft size={18} /> Back
        </button>
        {isChild && (
             <button onClick={() => navigate(`/programs/${program.parentProgram}`)} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-2">
                <Layers size={14}/> Master Program
             </button>
        )}
      </div>

      {/* HERO */}
      <div 
        className="rounded-3xl shadow-lg border border-gray-200 overflow-hidden mb-8 relative text-white min-h-[300px] flex items-end"
        style={{ backgroundImage: bgImage, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20"></div>
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
                      {program.participantsCount > 0 && <span className="flex items-center gap-1"><Users size={16}/> Exp: {program.participantsCount}</span>}
                  </div>
              </div>
              
              <div className="flex flex-col gap-2 w-full md:w-auto">
                  <button onClick={copyLink} className="bg-white text-gray-900 px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-all shadow-lg">
                      <Copy size={18}/> Copy Link
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
                  <h3 className="font-bold text-gray-800 mb-2 text-lg">About this Program</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{program.description || "No description provided."}</p>
              </div>

              {/* VERSIONS LIST */}
              {isParent && (
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                            <Layers size={20} className="text-blue-500"/>
                            {program.structure === 'Numerical' ? 'Program Batches' : 'Program Versions'}
                        </h3>
                        {canManage && (
                            <button onClick={() => setIsVersionModalOpen(true)} className="text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1">
                                <Plus size={14}/> Create Next
                            </button>
                        )}
                      </div>
                      <div className="space-y-3">
                          {program.children?.length > 0 ? (
                              program.children.map(child => (
                                  <div key={child._id} onClick={() => navigate(`/programs/${child._id}`)} className="p-4 rounded-xl border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50 transition-all cursor-pointer flex justify-between items-center bg-gray-50">
                                      <div>
                                          <p className="font-bold text-gray-700 hover:text-emerald-700">{child.customSuffix || child.name}</p>
                                          <p className="text-xs text-gray-400 mt-1">{new Date(child.date).toLocaleDateString()} • {child.participants?.length || 0} Attendees</p>
                                      </div>
                                      <ChevronRight size={18} className="text-gray-300"/>
                                  </div>
                              ))
                          ) : <p className="text-gray-400 text-sm italic text-center py-4">No versions yet.</p>}
                      </div>
                  </div>
              )}

              {/* PARTICIPANTS */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                          <Users size={20} className="text-emerald-600"/> 
                          Registered Attendees <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">{program.participants?.length || 0}</span>
                      </h3>
                      {canChat && (
                          <button 
                            onClick={() => setIsParticipantModalOpen(true)} 
                            className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 flex items-center gap-1"
                          >
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

              {/* CHAT / UPDATES */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg shrink-0">
                      <MessageSquare size={20} className="text-indigo-500"/> Team Chat
                  </h3>
                  
                  {/* MESSAGES AREA */}
                  <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-4 custom-scrollbar bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col">
                      {program.updates?.length > 0 ? (
                          program.updates.map((update, idx) => {
                              const isMe = update.user?._id === currentUser._id || update.user === currentUser._id;
                              
                              const showDateSeparator = idx === 0 || 
                                  getChatDateLabel(update.date) !== getChatDateLabel(program.updates[idx - 1].date);

                              return (
                                  <div key={idx} className="flex flex-col w-full">
                                      {showDateSeparator && (
                                          <div className="flex justify-center my-4 animate-in fade-in">
                                              <span className="bg-gray-200 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                                  {getChatDateLabel(update.date)}
                                              </span>
                                          </div>
                                      )}

                                      <div className={`flex gap-3 items-end animate-in fade-in slide-in-from-bottom-2 duration-300 w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                          {!isMe && (
                                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm border border-indigo-200 mb-1">
                                                  {update.user?.name?.[0]?.toUpperCase() || '?'}
                                              </div>
                                          )}
                                          
                                          <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                                              <div className="flex items-center gap-2 mb-1 px-1">
                                                  {!isMe && (
                                                      <span className="text-[10px] font-bold text-gray-600">
                                                          {update.user?.name || update.user?.fullName || 'Unknown'}
                                                      </span>
                                                  )}
                                                  <span className="text-[9px] text-gray-400">
                                                      {new Date(update.date).toLocaleString([], { hour: '2-digit', minute:'2-digit'})}
                                                  </span>
                                              </div>

                                              <div className={`p-3 text-sm shadow-sm leading-relaxed whitespace-pre-wrap ${
                                                  isMe 
                                                  ? 'bg-emerald-600 text-white rounded-2xl rounded-tr-none' 
                                                  : 'bg-white text-gray-700 rounded-2xl rounded-tl-none border border-gray-200' 
                                              }`}>
                                                  {update.text}
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              );
                          })
                      ) : (
                          <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                              <MessageSquare size={40} className="mb-2"/>
                              <p className="text-sm">No messages yet.</p>
                          </div>
                      )}
                      <div ref={chatEndRef} /> 
                  </div>

                  {/* INPUT AREA */}
                  {canChat && (
                      <div className="flex items-end gap-2 bg-white p-1 relative">
                          {showEmojiPicker && (
                              <div className="absolute bottom-16 left-0 z-50 shadow-2xl rounded-2xl animate-in slide-in-from-bottom-5">
                                  <EmojiPicker 
                                    onEmojiClick={onEmojiClick} 
                                    width={300} 
                                    height={400}
                                    previewConfig={{ showPreview: false }} 
                                  />
                              </div>
                          )}

                          <button 
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="p-3 mb-1 text-gray-400 hover:text-emerald-500 transition-colors"
                          >
                              <Smile size={24} />
                          </button>

                          <textarea 
                              className="flex-1 bg-gray-50 p-3 text-sm rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none resize-none transition-all" 
                              rows="1" 
                              placeholder="Type a message..." 
                              value={updateText} 
                              onChange={(e) => setUpdateText(e.target.value)}
                              onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handlePostUpdate();
                                  }
                              }}
                          />
                          <button 
                              onClick={handlePostUpdate} 
                              disabled={sendingUpdate || !updateText.trim()} 
                              className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-200 mb-1"
                          >
                              {sendingUpdate ? <Clock size={20} className="animate-spin"/> : <ArrowLeft size={20} className="rotate-90"/>}
                          </button>
                      </div>
                  )}
              </div>
          </div>

          {/* RIGHT COLUMN */}
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
                                <button key={status} onClick={() => handleStatusChange(status)} className={`text-xs font-bold py-2 rounded-lg border ${program.status === status ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-gray-500 border-gray-100'}`}>{status}</button>
                            ))}
                        </div>
                        {program.status !== 'Completed' && (
                            <button onClick={() => setIsCompleteModalOpen(true)} className="w-full py-2.5 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-black flex items-center justify-center gap-2">
                                <CheckCircle size={14}/> Mark as Complete
                            </button>
                        )}
                    </div>
                </>
              )}

              {/* ✅ FIX 2 & 3: DOCUMENT LINKS */}
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Download size={18} className="text-purple-500"/> Documents</h3>
                    <div className="space-y-2">
                      {program.proposal ? (
                          <a href={getFileUrl(program.proposal)} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100 hover:bg-purple-100"><LinkIcon size={14} className="text-purple-600"/><span className="text-xs font-bold text-purple-700 truncate">Proposal.pdf</span></a>
                      ) : <p className="text-xs text-gray-400 italic pl-2">No proposal.</p>}
                      {program.flyer ? (
                          <a href={getFileUrl(program.flyer)} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100 hover:bg-orange-100"><LinkIcon size={14} className="text-orange-600"/><span className="text-xs font-bold text-orange-700 truncate">Flyer.jpg</span></a>
                      ) : <p className="text-xs text-gray-400 italic pl-2">No flyer.</p>}
                    </div>
              </div>

              {program.status === 'Completed' && (
                  <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100 animate-in zoom-in">
                      <h3 className="font-bold text-emerald-800 mb-2 flex items-center gap-2">
                          <CheckCircle size={18}/> Completed
                      </h3>
                      <div className="space-y-2 text-xs text-emerald-700">
                          <p><strong>Attendance:</strong> {program.actualAttendance || 0}</p>
                          {program.driveLink && (
                              <a href={program.driveLink} target="_blank" rel="noreferrer" className="block text-emerald-600 underline hover:text-emerald-800">
                                  View Event Photos
                              </a>
                          )}
                          {/* ✅ FIX 4: FINAL DOCUMENT LINK */}
                          {program.finalDocument && (
                              <a href={getFileUrl(program.finalDocument)} target="_blank" rel="noreferrer" className="block text-emerald-600 underline hover:text-emerald-800">
                                  View Final Report
                              </a>
                          )}
                      </div>
                  </div>
              )}
          </div>
      </div>

      <AddProgramModal isOpen={isVersionModalOpen} onClose={() => setIsVersionModalOpen(false)} parentProgram={program} onSuccess={fetchProgram} />
      <EditProgramModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} program={program} onSuccess={fetchProgram} />
      <CompleteProgramModal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} program={program} onSuccess={fetchProgram} />
      <ManageParticipantsModal isOpen={isParticipantModalOpen} onClose={() => setIsParticipantModalOpen(false)} program={program} onSuccess={fetchProgram} />
    </div>
  );
};

export default ProgramDetails;