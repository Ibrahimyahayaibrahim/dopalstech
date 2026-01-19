import { useState, useRef, useMemo } from 'react'; 
import { X, Search, Trash2, Mail, Phone, Users, FileSpreadsheet, Plus, Upload, Save, Loader2, CheckCircle, Tag } from 'lucide-react';
import API from '../services/api';

const ManageParticipantsModal = ({ isOpen, onClose, program, onSuccess }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [isAdding, setIsAdding] = useState(false); 
  const [loading, setLoading] = useState(false);
  
  // ✅ FORM STATE
  const [coreData, setCoreData] = useState({ fullName: '', email: '', phone: '' });
  const [dynamicData, setDynamicData] = useState({});

  const fileInputRef = useRef(null);

  // --- SAFE DATA HANDLING ---
  const validParticipants = useMemo(() => {
      if (!program || !program.participants) return [];
      return program.participants.filter(p => p !== null && p !== undefined);
  }, [program]);

  // Search Logic
  const filteredParticipants = useMemo(() => {
      return validParticipants.filter(p => {
        if (typeof p === 'string') return p.toLowerCase().includes(searchTerm.toLowerCase());
        const term = searchTerm.toLowerCase();
        
        // Search Core Fields
        const coreMatch = (
            (p.fullName && p.fullName.toLowerCase().includes(term)) ||
            (p.email && p.email.toLowerCase().includes(term)) ||
            (p.phone && p.phone.toLowerCase().includes(term))
        );

        // Search Custom Data
        const customMatch = p.data && Object.values(p.data).some(val => 
            String(val).toLowerCase().includes(term)
        );

        // Search Legacy Fields
        const legacyMatch = (
            (p.organization && p.organization.toLowerCase().includes(term)) ||
            (p.state && p.state.toLowerCase().includes(term))
        );

        return coreMatch || customMatch || legacyMatch;
      });
  }, [validParticipants, searchTerm]);

  if (!isOpen || !program) return null;

  // --- ACTIONS ---

  const handleCoreChange = (key, value) => {
    setCoreData(prev => ({ ...prev, [key]: value }));
  };

  const handleDynamicChange = (label, value) => {
    setDynamicData(prev => ({ ...prev, [label]: value }));
  };

  const handleAddManual = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const payload = { ...coreData, ...dynamicData };
        await API.post(`/programs/${program._id}/participants/add`, payload);
        
        onSuccess();
        setIsAdding(false);
        setCoreData({ fullName: '', email: '', phone: '' }); 
        setDynamicData({});
        alert("Participant added successfully!");
    } catch (err) {
        alert(err.response?.data?.message || "Failed to add participant");
    } finally {
        setLoading(false);
    }
  };

  const handleRemove = async (participantId) => {
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

  // --- HELPER: MERGE DATA FOR DISPLAY ---
  // This combines old hardcoded fields and new dynamic fields into one list
  const getParticipantAttributes = (p) => {
      const attrs = [];

      // 1. Add "Old" fields if they exist and aren't empty
      if (p.ageGroup) attrs.push({ label: 'Age Group', value: p.ageGroup });
      if (p.gender) attrs.push({ label: 'Gender', value: p.gender });
      if (p.organization) attrs.push({ label: 'Org', value: p.organization });
      if (p.state) attrs.push({ label: 'State', value: p.state });

      // 2. Add "New" Dynamic fields (p.data)
      if (p.data) {
          Object.entries(p.data).forEach(([key, val]) => {
              // Avoid duplicates if key matches legacy field
              if (!['gender', 'state', 'organization', 'age'].includes(key.toLowerCase())) {
                  attrs.push({ label: key, value: val });
              }
          });
      }
      return attrs;
  };

  const handleExportCSV = () => {
    if (!validParticipants.length) return alert("No data to export");
    const headers = ["Full Name", "Email", "Phone", "Date", "Source", "Attributes"];
    
    const rows = validParticipants.map(p => {
        if (typeof p === 'string') return [p, "","","","",""];
        const attributes = getParticipantAttributes(p).map(a => `${a.label}: ${a.value}`).join('; ');
        
        return [
            `"${p.fullName || ''}"`, 
            `"${p.email || ''}"`, 
            `"${p.phone || ''}"`,
            `"${new Date(p.createdAt).toLocaleDateString()}"`,
            `"${p.referralSource || ''}"`,
            `"${attributes}"`
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

  const handleImportClick = () => fileInputRef.current.click();
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // ... (Keep existing import logic, it's fine)
    // For brevity, using the standard logic:
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
                // Map other columns to generic data if needed
                organization: cols[4]?.replace(/"/g, '').trim(),
            };
        }).filter(p => p && (p.email || p.phone));

        if (importedData.length === 0) return alert("No valid data found");
        setLoading(true);
        try {
            await API.post(`/programs/${program._id}/participants/import`, { participants: importedData });
            alert("Import successful!");
            onSuccess();
        } catch (err) { alert(err.message); } 
        finally { setLoading(false); e.target.value = ''; }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        
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
            <div className="p-6 bg-emerald-50 border-b border-emerald-100 animate-in slide-in-from-top duration-300 overflow-y-auto max-h-[50vh]">
                <form onSubmit={handleAddManual} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* CORE FIELDS */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Full Name <span className="text-red-500">*</span></label>
                        <input name="fullName" className="w-full p-2.5 rounded-lg border border-gray-300 text-sm focus:border-emerald-500 outline-none font-bold" required value={coreData.fullName} onChange={(e) => handleCoreChange('fullName', e.target.value)}/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Email Address <span className="text-red-500">*</span></label>
                        <input name="email" type="email" className="w-full p-2.5 rounded-lg border border-gray-300 text-sm focus:border-emerald-500 outline-none" required value={coreData.email} onChange={(e) => handleCoreChange('email', e.target.value)}/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Phone Number <span className="text-red-500">*</span></label>
                        <input name="phone" className="w-full p-2.5 rounded-lg border border-gray-300 text-sm focus:border-emerald-500 outline-none" required value={coreData.phone} onChange={(e) => handleCoreChange('phone', e.target.value)}/>
                    </div>

                    {/* DYNAMIC FIELDS */}
                    {program.registration.formFields?.map((field, idx) => (
                        <div key={idx} className="space-y-1">
                            <label className="text-[10px] font-bold text-emerald-700 uppercase">{field.label} {field.required && '*'}</label>
                            {field.fieldType === 'textarea' ? (
                                <textarea className="w-full p-2.5 rounded-lg border border-emerald-200 text-sm outline-none" rows="1" required={field.required} onChange={(e) => handleDynamicChange(field.label, e.target.value)}/>
                            ) : field.fieldType === 'select' ? (
                                <select className="w-full p-2.5 rounded-lg border border-emerald-200 text-sm outline-none" required={field.required} onChange={(e) => handleDynamicChange(field.label, e.target.value)}>
                                    <option value="">Select...</option>
                                    {field.options?.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                                </select>
                            ) : (
                                <input type={field.fieldType} className="w-full p-2.5 rounded-lg border border-emerald-200 text-sm outline-none" required={field.required} onChange={(e) => handleDynamicChange(field.label, e.target.value)}/>
                            )}
                        </div>
                    ))}

                    <div className="col-span-full flex justify-end mt-4 pt-4 border-t border-emerald-100">
                        <button disabled={loading} className="bg-emerald-600 text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 flex items-center gap-2 shadow-lg shadow-emerald-200">
                            {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Save Participant
                        </button>
                    </div>
                </form>
            </div>
        )}

        {/* TOOLBAR */}
        {!isAdding && (
            <div className="p-4 border-b border-gray-100 bg-white flex items-center gap-4 shrink-0">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
                    <input className="w-full pl-10 p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 transition-all text-sm font-medium" placeholder="Search participants..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                </div>
            </div>
        )}

        {/* DATA TABLE - REDESIGNED */}
        <div className="flex-1 overflow-auto bg-gray-50/50">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100/50 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                        <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Participant</th>
                        <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact</th>
                        {/* ✅ UNIFIED COLUMN FOR ALL DATA */}
                        <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-1/3">Attributes / Data</th>
                        <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredParticipants.length === 0 ? (
                        <tr><td colSpan="4" className="p-10 text-center text-gray-400 italic">No participants found.</td></tr>
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
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded uppercase font-bold tracking-wide">
                                                    {typeof p === 'object' ? (p.referralSource || 'Legacy') : 'Legacy'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                
                                <td className="p-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-xs text-gray-600"><Mail size={12} className="text-gray-400"/> {typeof p === 'object' ? p.email : p}</div>
                                        {typeof p === 'object' && p.phone && (<div className="flex items-center gap-2 text-xs text-gray-600"><Phone size={12} className="text-gray-400"/> {p.phone}</div>)}
                                    </div>
                                </td>

                                {/* ✅ DYNAMIC ATTRIBUTES COLUMN */}
                                <td className="p-4">
                                    {typeof p === 'object' ? (
                                        <div className="flex flex-wrap gap-2">
                                            {getParticipantAttributes(p).length > 0 ? (
                                                getParticipantAttributes(p).map((attr, i) => (
                                                    <div key={i} className="flex items-center gap-1 text-[11px] bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100">
                                                        <Tag size={10} className="text-blue-400"/>
                                                        <span className="font-bold text-blue-800 uppercase">{attr.label}:</span>
                                                        <span className="truncate max-w-[100px]">{attr.value}</span>
                                                    </div>
                                                ))
                                            ) : <span className="text-xs text-gray-300 italic">No additional data</span>}
                                        </div>
                                    ) : <span className="text-xs text-gray-400">Legacy ID</span>}
                                </td>

                                <td className="p-4 text-right">
                                    <button 
                                        onClick={() => typeof p === 'object' && p._id && handleRemove(p._id)} 
                                        disabled={deleting === p._id || typeof p !== 'object'} 
                                        className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
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