import { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, FileText, Type, Repeat, Hash, Image as ImageIcon, File, User, MapPin, Save, Loader2 } from 'lucide-react';
import API from '../services/api';

const EditProgramModal = ({ isOpen, onClose, program, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [freqMode, setFreqMode] = useState('number'); 

  const [formData, setFormData] = useState({
    name: '',
    type: 'Training',
    date: '',
    description: '',
    cost: '',
    frequency: '1',
    venue: '',
    participantsCount: '',
    courseTitle: '',
    startupsCount: '',
    flyer: '',
    proposal: ''
  });

  useEffect(() => {
    if (program && isOpen) {
        // Safe Date Parsing
        const formattedDate = program.date ? new Date(program.date).toISOString().split('T')[0] : '';
        const isNum = !isNaN(program.frequency);
        setFreqMode(isNum ? 'number' : 'recurring');

        setFormData({
            name: program.name || '',
            type: program.type || 'Training',
            date: formattedDate,
            description: program.description || '',
            cost: program.cost || '',
            frequency: program.frequency || '1',
            venue: program.venue || '',
            participantsCount: program.participantsCount || '',
            courseTitle: program.courseTitle || '',
            startupsCount: program.startupsCount || '',
            flyer: program.flyer || '',
            proposal: program.proposal || ''
        });
    }
  }, [program, isOpen]);

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);
    setUploading(true);

    try {
      const res = await API.post('/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData(prev => ({ ...prev, [fieldName]: res.data }));
    } catch (err) {
      alert("File upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatePayload = {
        ...formData,
        participantsCount: Number(formData.participantsCount || 0),
        startupsCount: Number(formData.startupsCount || 0),
        date: formData.date ? new Date(formData.date) : null 
      };

      await API.put(`/programs/${program._id}`, updatePayload);
      onSuccess(); 
      onClose();   
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update program");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-enter">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
          <div>
              <h2 className="text-xl font-bold text-gray-800">Edit Program</h2>
              <p className="text-xs text-emerald-600 font-bold uppercase tracking-wide">Update Details</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="editForm" onSubmit={handleSubmit} className="space-y-5">
            
            {/* 1. NAME & TYPE */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Name</label>
                <div className="relative">
                    <Type className="absolute left-3 top-3 text-gray-400" size={16} />
                    <input required className="w-full pl-10 p-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-gray-700" 
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Type</label>
                <select className="w-full p-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-gray-700"
                  value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="Training">Training</option>
                  <option value="Event">Event</option>
                  <option value="Project">Project</option>
                  <option value="Pitch-IT">Pitch-IT</option>
                </select>
              </div>
            </div>

            {/* 2. FREQUENCY */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Frequency</label>
                <div className="flex bg-white rounded-lg p-1 mb-3 border border-gray-200">
                  <button type="button" onClick={() => { setFreqMode('number'); setFormData({...formData, frequency: '1'}) }} className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-2 ${freqMode === 'number' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-400'}`}><Hash size={14}/> Numeric</button>
                  <button type="button" onClick={() => { setFreqMode('recurring'); setFormData({...formData, frequency: 'Recurring'}) }} className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-2 ${freqMode === 'recurring' ? 'bg-blue-100 text-blue-700' : 'text-gray-400'}`}><Repeat size={14}/> Recurring</button>
                </div>
                {freqMode === 'number' && (
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 text-emerald-500" size={16} />
                    <input type="number" min="1" required className="w-full pl-10 p-3 bg-white rounded-xl border border-gray-200 font-bold" value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value})} />
                  </div>
                )}
            </div>

            {/* 3. VENUE & ATTENDEES */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Venue</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 text-gray-400" size={16}/>
                        <input className="w-full pl-10 p-3 bg-gray-50 rounded-xl text-sm font-bold border-none outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Attendees</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-gray-400" size={16}/>
                        <input type="number" className="w-full pl-10 p-3 bg-gray-50 rounded-xl text-sm font-bold border-none outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.participantsCount} onChange={e => setFormData({...formData, participantsCount: e.target.value})} />
                    </div>
                </div>
            </div>

            {/* 4. EXTRAS */}
            {formData.type === 'Training' && (
               <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Course Title</label>
                  <input className="w-full p-3 bg-gray-50 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.courseTitle || ''} onChange={e => setFormData({...formData, courseTitle: e.target.value})} />
               </div>
            )}
            {formData.type === 'Pitch-IT' && (
               <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Startups Count</label>
                  <input type="number" className="w-full p-3 bg-gray-50 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.startupsCount || ''} onChange={e => setFormData({...formData, startupsCount: e.target.value})} />
               </div>
            )}

            {/* 5. DATE & BUDGET */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Date</label>
                  <div className="relative">
                     <Calendar className="absolute left-3 top-3 text-gray-400" size={16} />
                     <input type="date" required className="w-full pl-10 p-3 bg-gray-50 rounded-xl font-bold text-gray-700 border-none outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>
              </div>
              <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Budget (₦)</label>
                  <div className="relative">
                     <DollarSign className="absolute left-3 top-3 text-gray-400" size={16} />
                     <input type="number" className="w-full pl-10 p-3 bg-gray-50 rounded-xl font-bold text-gray-700 border-none outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} />
                  </div>
              </div>
            </div>

            {/* 6. FILES */}
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Update Flyer</label>
                  <div className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-colors ${formData.flyer ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'flyer')} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <ImageIcon size={20} className={`mx-auto mb-1 ${formData.flyer ? 'text-emerald-600' : 'text-gray-300'}`} />
                      <span className="text-[10px] font-bold text-gray-500">{formData.flyer ? 'Change Image' : 'Upload New'}</span>
                  </div>
               </div>
               <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Update Proposal</label>
                  <div className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-colors ${formData.proposal ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => handleFileUpload(e, 'proposal')} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <File size={20} className={`mx-auto mb-1 ${formData.proposal ? 'text-blue-600' : 'text-gray-300'}`} />
                      <span className="text-[10px] font-bold text-gray-500">{formData.proposal ? 'Change Doc' : 'Upload New'}</span>
                  </div>
               </div>
            </div>

            {/* 7. DESCRIPTION */}
            <div>
               <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Description</label>
               <div className="relative">
                  <FileText className="absolute left-3 top-3 text-gray-400" size={16} />
                  <textarea rows="3" className="w-full pl-10 p-3 bg-gray-50 rounded-xl text-sm text-gray-700 resize-none border-none outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
               </div>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50">
           <button form="editForm" disabled={loading || uploading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-70 flex justify-center items-center gap-2">
              {uploading ? <><Loader2 className="animate-spin" size={20}/> Uploading...</> : loading ? <><Loader2 className="animate-spin" size={20}/> Saving...</> : <><Save size={20}/> Save Changes</>}
           </button>
        </div>

      </div>
    </div>
  );
};

export default EditProgramModal;