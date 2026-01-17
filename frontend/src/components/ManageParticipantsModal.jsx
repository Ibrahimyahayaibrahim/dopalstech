import { useState, useRef, useMemo } from 'react'; // Added useMemo for efficiency
import { X, Search, Trash2, Mail, Phone, MapPin, Briefcase, Users, FileSpreadsheet, Plus, Upload, Save, Loader2 } from 'lucide-react';
import API from '../services/api';

const ManageParticipantsModal = ({ isOpen, onClose, program, onSuccess }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [isAdding, setIsAdding] = useState(false); 
  const [loading, setLoading] = useState(false);
  
  const [newParticipant, setNewParticipant] = useState({
    fullName: '', email: '', phone: '', gender: '', organization: '', state: '', ageGroup: ''
  });

  const fileInputRef = useRef(null);

  // --- SAFE DATA HANDLING ---
  // 1. Filter out NULLs immediately to prevent crashes
  const validParticipants = useMemo(() => {
      if (!program || !program.participants) return [];
      return program.participants.filter(p => p !== null && p !== undefined);
  }, [program]);

  // 2. Filter based on Search Term
  const filteredParticipants = useMemo(() => {
      return validParticipants.filter(p => {
        // Handle Legacy String IDs (just in case)
        if (typeof p === 'string') return p.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Handle Objects
        const term = searchTerm.toLowerCase();
        return (
            (p.fullName && p.fullName.toLowerCase().includes(term)) ||
            (p.email && p.email.toLowerCase().includes(term)) ||
            (p.organization && p.organization.toLowerCase().includes(term)) ||
            (p.state && p.state.toLowerCase().includes(term))
        );
      });
  }, [validParticipants, searchTerm]);

  if (!isOpen || !program) return null;

  // --- ACTIONS ---
  
  const handleRemove = async (participantId) => {
    // Check if ID exists (handle legacy string case)
    if (!participantId) return alert("Cannot remove this legacy record.");
    
    if (!window.confirm("Are you sure you want to remove this participant?")) return;
    setDeleting(participantId);
    try {
        await API.delete(`/programs/${program._id}/participants/${participantId}`);
        onSuccess(); 
    } catch (err) {
        alert("Failed to remove participant");
    } finally {
        setDeleting(null);
    }
  };

  const handleExportCSV = () => {
    if (!validParticipants.length) return alert("No data to export");
    const headers = ["Full Name", "Email", "Phone", "Gender", "Age Group", "State", "Organization"];
    const rows = validParticipants.map(p => {
        if (typeof p === 'string') return [p, "","","","","",""];
        return [
            `"${p.fullName || ''}"`, `"${p.email || ''}"`, `"${p.phone || ''}"`,
            `"${p.gender || ''}"`, `"${p.ageGroup || ''}"`, `"${p.state || ''}"`, `"${p.organization || ''}"`
        ];
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `${program.name}_Participants.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddManual = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        await API.post(`/programs/${program._id}/participants/manual`, newParticipant);
        onSuccess();
        setIsAdding(false);
        setNewParticipant({ fullName: '', email: '', phone: '', gender: '', organization: '', state: '', ageGroup: '' });
    } catch (err) {
        alert(err.response?.data?.message || "Failed to add participant");
    } finally {
        setLoading(false);
    }
  };

  const handleImportClick = () => fileInputRef.current.click();
  
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        const text = event.target.result;
        const rows = text.split('\n').slice(1); 
        
        const importedData = rows.map(row => {
            const cols = row.split(',');
            if (cols.length < 2) return null;
            return {
                fullName: cols[0]?.replace(/"/g, '').trim(),
                email: cols[1]?.replace(/"/g, '').trim(),
                phone: cols[2]?.replace(/"/g, '').trim(),
                gender: cols[3]?.replace(/"/g, '').trim(),
                organization: cols[4]?.replace(/"/g, '').trim(),
                state: cols[5]?.replace(/"/g, '').trim(),
            };
        }).filter(p => p && (p.email || p.phone));

        if (importedData.length === 0) return alert("No valid data found in CSV");

        setLoading(true);
        try {
            await API.post(`/programs/${program._id}/participants/import`, { participants: importedData });
            alert("Import successful!");
            onSuccess();
        } catch (err) {
            alert("Import failed: " + err.message);
        } finally {
            setLoading(false);
            e.target.value = ''; 
        }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        
        {/* HEADER */}
        <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="text-emerald-600"/> Manage Participants
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-1">
                {program.name} • <span className="font-bold text-emerald-600">{validParticipants.length} Registered</span>
              </p>
          </div>
          <div className="flex gap-2">
             <button onClick={() => setIsAdding(!isAdding)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isAdding ? 'bg-gray-200 text-gray-600' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'}`}>
                {isAdding ? <X size={18}/> : <Plus size={18}/>} {isAdding ? 'Cancel' : 'Add New'}
             </button>
             
             <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
             <button onClick={handleImportClick} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors border border-blue-100">
                <Upload size={18}/> Import
             </button>

             <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors border border-emerald-100">
                <FileSpreadsheet size={18}/> Export
             </button>
             
             <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm ml-2">
                <X size={20} />
             </button>
          </div>
        </div>

        {/* ADD FORM */}
        {isAdding && (
            <div className="p-4 bg-emerald-50 border-b border-emerald-100 animate-in slide-in-from-top duration-300">
                <form onSubmit={handleAddManual} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input required placeholder="Full Name" className="p-2.5 rounded-lg border border-emerald-200 text-sm" value={newParticipant.fullName} onChange={e => setNewParticipant({...newParticipant, fullName: e.target.value})} />
                    <input required placeholder="Email" type="email" className="p-2.5 rounded-lg border border-emerald-200 text-sm" value={newParticipant.email} onChange={e => setNewParticipant({...newParticipant, email: e.target.value})} />
                    <input placeholder="Phone" className="p-2.5 rounded-lg border border-emerald-200 text-sm" value={newParticipant.phone} onChange={e => setNewParticipant({...newParticipant, phone: e.target.value})} />
                    
                    <select className="p-2.5 rounded-lg border border-emerald-200 text-sm" value={newParticipant.gender} onChange={e => setNewParticipant({...newParticipant, gender: e.target.value})}>
                        <option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option>
                    </select>

                    <select className="p-2.5 rounded-lg border border-emerald-200 text-sm" value={newParticipant.ageGroup} onChange={e => setNewParticipant({...newParticipant, ageGroup: e.target.value})}>
                        <option value="">Select Age</option>
                        <option value="Under 18">Under 18</option>
                        <option value="18-25">18-25</option>
                        <option value="26-35">26-35</option>
                        <option value="36-50">36-50</option>
                        <option value="50+">50+</option>
                    </select>

                    <input placeholder="State" className="p-2.5 rounded-lg border border-emerald-200 text-sm" value={newParticipant.state} onChange={e => setNewParticipant({...newParticipant, state: e.target.value})} />
                    <input placeholder="Organization" className="p-2.5 rounded-lg border border-emerald-200 text-sm md:col-span-2" value={newParticipant.organization} onChange={e => setNewParticipant({...newParticipant, organization: e.target.value})} />
                    
                    <div className="md:col-span-4 flex justify-end">
                        <button disabled={loading} className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 flex items-center gap-2">
                            {loading ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Save Participant
                        </button>
                    </div>
                </form>
            </div>
        )}

        {/* TOOLBAR */}
        <div className="p-4 border-b border-gray-100 bg-white flex items-center gap-4 shrink-0">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
                <input 
                    className="w-full pl-10 p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 transition-all text-sm font-medium"
                    placeholder="Search by name, email, organization or state..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        {/* TABLE BODY */}
        <div className="flex-1 overflow-auto bg-gray-50/50">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100/50 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                        <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Participant</th>
                        <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact</th>
                        <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Details</th>
                        <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Location/Org</th>
                        <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredParticipants.length === 0 ? (
                        <tr><td colSpan="5" className="p-10 text-center text-gray-400 italic">No participants found.</td></tr>
                    ) : (
                        filteredParticipants.map((p, idx) => (
                            <tr key={p._id || idx} className="hover:bg-gray-50 transition-colors group">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs uppercase">
                                            {typeof p === 'object' ? p.fullName?.[0] : '?'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{typeof p === 'object' ? p.fullName : 'Unknown'}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">{typeof p === 'object' ? p.gender || 'N/A' : ''}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-xs text-gray-600"><Mail size={12} className="text-gray-400"/> {typeof p === 'object' ? p.email : p}</div>
                                        {typeof p === 'object' && p.phone && (<div className="flex items-center gap-2 text-xs text-gray-600"><Phone size={12} className="text-gray-400"/> {p.phone}</div>)}
                                    </div>
                                </td>
                                <td className="p-4">
                                     <div className="space-y-1">
                                        <p className="text-xs font-medium text-gray-700">Age: <span className="font-bold">{typeof p === 'object' ? p.ageGroup || '-' : '-'}</span></p>
                                        <p className="text-[10px] text-gray-400 uppercase bg-gray-100 inline-block px-1.5 py-0.5 rounded">{typeof p === 'object' ? p.referralSource || 'Direct' : 'Legacy'}</p>
                                     </div>
                                </td>
                                <td className="p-4">
                                    <div className="space-y-1">
                                        {typeof p === 'object' && p.state && (<div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium"><MapPin size={12} className="text-blue-400"/> {p.state}</div>)}
                                        {typeof p === 'object' && p.organization && (<div className="flex items-center gap-1.5 text-xs text-gray-500"><Briefcase size={12} className="text-gray-400"/> {p.organization}</div>)}
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <button 
                                        // CHECK FOR ID BEFORE ALLOWING DELETE
                                        onClick={() => typeof p === 'object' && p._id && handleRemove(p._id)} 
                                        disabled={deleting === p._id || typeof p !== 'object'} 
                                        className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={typeof p !== 'object' ? "Legacy Record (Cannot Delete)" : "Remove"}
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default ManageParticipantsModal;