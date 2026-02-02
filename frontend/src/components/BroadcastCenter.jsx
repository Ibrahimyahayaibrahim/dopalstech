import { useState, useRef, useEffect } from 'react';
import { Send, Upload, Users, FileText, X, CheckCircle, AlertCircle, Mail, Plus, History, Clock, Loader2, Trash2 } from 'lucide-react';
import Papa from 'papaparse'; 
import API from '../services/api';
import { useUI } from '../context/UIContext';

const BroadcastCenter = () => {
  const { showToast, confirmAction } = useUI();
  const [activeView, setActiveView] = useState('compose'); 
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  
  const user = JSON.parse(localStorage.getItem('user'));
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [audienceType, setAudienceType] = useState('general');
  const [programs, setPrograms] = useState([]); 
  const [selectedPrograms, setSelectedPrograms] = useState([]); 
  const [sendToAllParticipants, setSendToAllParticipants] = useState(false);
  const [manualEmails, setManualEmails] = useState('');
  const [csvRecipients, setCsvRecipients] = useState([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchPrograms = async () => {
        try {
            const res = await API.get('/programs'); 
            if (Array.isArray(res.data)) setPrograms(res.data);
            else setPrograms([]);
        } catch(err) { console.error("Failed to load programs", err); setPrograms([]); }
    };
    fetchPrograms();
  }, []);

  const fetchHistory = async () => {
      try {
          const res = await API.get('/broadcast/history');
          setHistoryLogs(res.data);
      } catch (err) { console.error("Failed to fetch history"); }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      complete: (results) => {
        const recipients = results.data
          .map(row => ({
              name: row.name || row.Name || row['Full Name'] || 'Unknown',
              email: row.email || row.Email || row['Email Address'] || row[0]
          })) 
          .filter(r => r.email && r.email.includes('@')); 
        setCsvRecipients(recipients);
      },
      header: true, skipEmptyLines: true,
    });
    e.target.value = null; 
  };

  const removeCsvRecipient = (indexToRemove) => {
      setCsvRecipients(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleProgramSelect = (e) => {
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setSelectedPrograms(selectedOptions);
  };

  const handleSendBroadcast = async () => {
    if (!subject || !message) {
        showToast("Subject and Message are required!", "error");
        return;
    }
    
    const confirmed = await confirmAction(
        "Are you ready to send this broadcast? Emails will be sent immediately.",
        "Confirm Broadcast",
        { confirmText: "Send Now", type: "warning" }
    );
    if (!confirmed) return;
    
    setLoading(true);
    try {
      const finalProgramIds = sendToAllParticipants ? ['ALL_PROGRAMS'] : selectedPrograms;

      const payload = {
        audience: audienceType,
        targetProgramIds: finalProgramIds,
        manualRecipients: audienceType === 'manual' ? manualEmails.split(',').map(e => e.trim()) : [],
        csvRecipients: audienceType === 'csv' ? csvRecipients : [],
        subject,
        message,
        channels: ['email'] 
      };

      const { data } = await API.post('/broadcast/send', payload);
      
      showToast(data.message || "Broadcast queued successfully!", "success");
      
      setStep(1);
      setSubject('');
      setMessage('');
      setCsvRecipients([]);
      setSelectedPrograms([]);
      fetchHistory(); 
      setActiveView('history'); 
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to send broadcast.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-enter">
        
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Mail className="text-emerald-600 dark:text-emerald-400"/> Broadcast Center
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Announcements & Notifications</p>
          </div>
          <div className="flex bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm border border-gray-100 dark:border-gray-700">
              <button onClick={() => setActiveView('compose')} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${activeView === 'compose' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>Compose</button>
              <button onClick={() => { setActiveView('history'); fetchHistory(); }} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${activeView === 'history' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>History</button>
          </div>
      </div>

      {activeView === 'compose' && (
        <>
            {/* Steps Indicator */}
            <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <Step number={1} label="Audience" active={step === 1} done={step > 1} onClick={() => setStep(1)}/>
                <div className="h-0.5 w-10 bg-gray-100 dark:bg-gray-700"></div>
                <Step number={2} label="Message" active={step === 2} done={step > 2} onClick={() => setStep(2)}/>
                <div className="h-0.5 w-10 bg-gray-100 dark:bg-gray-700"></div>
                <Step number={3} label="Review" active={step === 3} done={step > 3} onClick={() => setStep(3)}/>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                
                {/* STEP 1: AUDIENCE */}
                {step === 1 && (
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 animate-enter transition-colors duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <SelectionCard icon={<Users/>} title={isSuperAdmin ? "All Staff" : "My Dept Staff"} desc={isSuperAdmin ? "Send to everyone" : "Send to your department"} selected={audienceType === 'general'} onClick={() => setAudienceType('general')}/>
                            <SelectionCard icon={<FileText/>} title="Participants" desc="By specific programs" selected={audienceType === 'program'} onClick={() => setAudienceType('program')}/>
                            <SelectionCard icon={<Upload/>} title="Upload CSV" desc="External lists" selected={audienceType === 'csv'} onClick={() => setAudienceType('csv')}/>
                            <SelectionCard icon={<Plus/>} title="Manual Entry" desc="Type emails directly" selected={audienceType === 'manual'} onClick={() => setAudienceType('manual')}/>
                        </div>

                        {audienceType === 'program' && (
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-xl border border-emerald-100 dark:border-emerald-800 animate-enter">
                                <label className="flex items-center gap-2 mb-4 cursor-pointer font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                                    <input type="checkbox" className="w-4 h-4 accent-emerald-600 rounded" checked={sendToAllParticipants} onChange={(e) => setSendToAllParticipants(e.target.checked)} />
                                    Send to ALL participants of ANY program
                                </label>
                                {!sendToAllParticipants && (
                                    <>
                                        <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase block mb-2">Select Programs (Ctrl+Click)</label>
                                        <select multiple className="w-full p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-800 dark:text-gray-200 h-48 focus:ring-2 ring-emerald-500 outline-none text-sm" value={selectedPrograms} onChange={handleProgramSelect}>
                                            {programs.length > 0 ? (
                                                programs.map(prog => (
                                                    <option key={prog._id} value={prog._id}>{prog.name || prog.title}</option>
                                                ))
                                            ) : (
                                                <option disabled>No programs found.</option>
                                            )}
                                        </select>
                                    </>
                                )}
                            </div>
                        )}
                        
                        {/* CSV UPLOAD */}
                        {audienceType === 'csv' && (
                           <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800 text-center animate-enter">
                              <input type="file" ref={fileInputRef} accept=".csv" onChange={handleFileUpload} className="hidden" />
                              
                              {csvRecipients.length === 0 ? (
                                  <>
                                    <button onClick={() => fileInputRef.current.click()} className="px-6 py-3 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 font-bold rounded-xl shadow-sm mb-2 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">Choose CSV File</button>
                                    <p className="text-xs text-blue-400 mt-2">Format: Headers 'email' and 'name'</p>
                                  </>
                              ) : (
                                  <div className="w-full">
                                      <div className="flex justify-between items-center mb-3">
                                          <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase">{csvRecipients.length} Recipients Found</span>
                                          <div className="flex gap-2">
                                              <button onClick={() => setCsvRecipients([])} className="text-[10px] text-red-500 font-bold hover:underline">Clear All</button>
                                              <button onClick={() => fileInputRef.current.click()} className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline">Upload New</button>
                                          </div>
                                      </div>
                                      
                                      <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-100 dark:border-blue-900 overflow-hidden max-h-60 overflow-y-auto shadow-sm text-left">
                                          <table className="w-full">
                                              <thead className="bg-blue-50/50 dark:bg-blue-900/40 text-[10px] font-bold text-blue-400 uppercase sticky top-0">
                                                  <tr>
                                                      <th className="p-3">Name</th>
                                                      <th className="p-3">Email</th>
                                                      <th className="p-3 w-8"></th>
                                                  </tr>
                                              </thead>
                                              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                  {csvRecipients.map((recipient, idx) => (
                                                      <tr key={idx} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/20">
                                                          <td className="p-3 text-xs font-bold text-gray-700 dark:text-gray-200">{recipient.name}</td>
                                                          <td className="p-3 text-xs text-gray-600 dark:text-gray-400">{recipient.email}</td>
                                                          <td className="p-3 text-center">
                                                              <button onClick={() => removeCsvRecipient(idx)} className="text-gray-300 hover:text-red-500 transition-colors">
                                                                  <Trash2 size={14}/>
                                                              </button>
                                                          </td>
                                                      </tr>
                                                  ))}
                                              </tbody>
                                          </table>
                                      </div>
                                  </div>
                              )}
                           </div>
                        )}
                        
                        {audienceType === 'manual' && (
                           <textarea className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 h-32 text-sm focus:border-emerald-500 outline-none" placeholder="Enter emails separated by commas..." value={manualEmails} onChange={(e) => setManualEmails(e.target.value)}></textarea>
                        )}

                        <div className="mt-8 flex justify-end">
                            <button onClick={() => setStep(2)} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200/50 dark:shadow-none transition-all flex items-center gap-2">Next Step <Send size={16} className="rotate-90"/></button>
                        </div>
                    </div>
                )}

                {/* STEP 2: COMPOSE */}
                {step === 2 && (
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 animate-enter transition-colors duration-300">
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Subject</label>
                                <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-bold text-gray-800 dark:text-white outline-none focus:border-emerald-500" placeholder="Announcement Title" value={subject} onChange={(e) => setSubject(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Message Body</label>
                                <textarea className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-64 resize-none outline-none focus:border-emerald-500 text-sm leading-relaxed text-gray-800 dark:text-gray-200" placeholder="Type your message here..." value={message} onChange={(e) => setMessage(e.target.value)}></textarea>
                            </div>
                        </div>
                        <div className="mt-8 flex justify-between">
                            <button onClick={() => setStep(1)} className="text-gray-400 font-bold hover:text-gray-600 dark:hover:text-gray-300">Back</button>
                            <button onClick={() => setStep(3)} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-all">Review</button>
                        </div>
                    </div>
                )}

                {/* STEP 3: REVIEW */}
                {step === 3 && (
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 animate-enter transition-colors duration-300">
                        <div className="flex items-start gap-4 mb-8 p-5 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-2xl border border-amber-100/50 dark:border-amber-800">
                            <AlertCircle size={24} className="mt-0.5 shrink-0"/>
                            <div><p className="font-bold text-lg">Ready to broadcast?</p><p className="text-sm opacity-80 mt-1">This action will send emails immediately.</p></div>
                        </div>
                        <div className="space-y-4 mb-8 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl">
                            <ReviewItem label="Audience Type" value={audienceType.toUpperCase()} />
                            <ReviewItem label="Recipients" value={audienceType === 'csv' ? `${csvRecipients.length} Contacts` : (audienceType === 'manual' ? 'Manual List' : 'Selected Group')} />
                            <ReviewItem label="Subject" value={subject} />
                            <div className="pt-2">
                                <span className="text-xs font-bold text-gray-400 uppercase block mb-2">Message Preview</span>
                                <p className="text-sm text-gray-600 dark:text-gray-300 italic line-clamp-3">"{message}"</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <button onClick={() => setStep(2)} className="text-gray-400 font-bold hover:text-gray-600 dark:hover:text-gray-300">Back to Edit</button>
                            <button onClick={handleSendBroadcast} disabled={loading} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-70">
                                {loading ? <Loader2 className="animate-spin"/> : <><Send size={18}/> Send Now</>}
                            </button>
                        </div>
                    </div>
                )}
                </div>

                {/* Right Panel */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                        <h4 className="font-bold text-lg mb-4 relative z-10">Usage Tips</h4>
                        <ul className="text-sm text-emerald-100 space-y-3 list-disc list-inside relative z-10 opacity-90">
                            <li>Use <strong>Participants</strong> to target specific groups from past events.</li>
                            <li><strong>General Staff</strong> sends to all active users.</li>
                            <li><strong>CSV Upload</strong> allows you to verify the list before sending.</li>
                        </ul>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    </div>
                </div>
            </div>
        </>
      )}

      {/* HISTORY */}
      {activeView === 'history' && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-enter transition-colors duration-300">
              <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-400 font-bold uppercase text-[10px] border-b border-gray-100 dark:border-gray-700">
                      <tr>
                          <th className="p-5 pl-8">Date Sent</th>
                          <th className="p-5">Subject</th>
                          <th className="p-5">Audience</th>
                          <th className="p-5">Count</th>
                          <th className="p-5">Sender</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                      {historyLogs.map(log => (
                          <tr key={log._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                              <td className="p-5 pl-8 text-gray-500 dark:text-gray-400 text-sm font-medium flex items-center gap-2">
                                  <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg"><Clock size={14}/></div>
                                  {new Date(log.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-5 font-bold text-gray-800 dark:text-gray-200">{log.subject}</td>
                              <td className="p-5">
                                  <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md text-[10px] font-bold uppercase border border-blue-100 dark:border-blue-800">{log.audienceType}</span>
                              </td>
                              <td className="p-5 text-emerald-600 dark:text-emerald-400 font-bold">{log.recipientCount}</td>
                              <td className="p-5 text-gray-400 text-xs font-bold uppercase">{log.sender?.name || 'Unknown'}</td>
                          </tr>
                      ))}
                      {historyLogs.length === 0 && (
                          <tr><td colSpan="6" className="p-16 text-center text-gray-400 flex flex-col items-center justify-center"><History size={32} className="mb-2 opacity-20"/><p>No broadcast history found.</p></td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      )}

    </div>
  );
};

const Step = ({ number, label, active, done, onClick }) => (
    <div onClick={onClick} className={`flex items-center gap-2 cursor-pointer transition-opacity ${active ? 'opacity-100' : 'opacity-40 hover:opacity-80'}`}>
       <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${active || done ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
          {done ? <CheckCircle size={16}/> : number}
       </div>
       <span className={`font-bold text-sm ${active ? 'text-gray-800 dark:text-white' : 'text-gray-400'}`}>{label}</span>
    </div>
);

const SelectionCard = ({ icon, title, desc, selected, onClick }) => (
    <div onClick={onClick} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${selected ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
       <div className={`p-3 rounded-xl transition-colors ${selected ? 'bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>{icon}</div>
       <div><h4 className={`font-bold text-sm ${selected ? 'text-emerald-900 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300'}`}>{title}</h4><p className="text-xs text-gray-400 leading-tight mt-1">{desc}</p></div>
    </div>
);

const ReviewItem = ({ label, value }) => (
    <div className="flex justify-between border-b border-gray-200/50 dark:border-gray-700/50 pb-2">
       <span className="text-xs font-bold text-gray-400 uppercase">{label}</span>
       <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{value}</span>
    </div>
);

export default BroadcastCenter;