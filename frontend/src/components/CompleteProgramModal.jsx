import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { X, CheckCircle, Upload, Link, MessageSquare, Loader2 } from 'lucide-react';

const CompleteProgramModal = ({ isOpen, onClose, program, onSuccess }) => {
  const [formData, setFormData] = useState({
    actualAttendance: '',
    startDate: '',
    endDate: '',
    driveLink: '',
    completionComment: ''
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Identify if this is a Master Program (Numerical or Recurring Parent)
  const isMaster = program && !program.parentProgram && (program.structure === 'Numerical' || program.structure === 'Recurring');

  useEffect(() => {
      if (program && isOpen) {
          setFormData({
              actualAttendance: '',
              // Try to grab the start date from the program, or default to empty
              startDate: program.date ? new Date(program.date).toISOString().split('T')[0] : '',
              // Default end date to today
              endDate: new Date().toISOString().split('T')[0],
              driveLink: '',
              completionComment: ''
          });
          setFile(null);
      }
  }, [program, isOpen]);

  if (!isOpen || !program) return null;

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const data = new FormData();
      
      // ✅ Logic: If Master, send 0 (aggregate calculated elsewhere). If Instance, send input.
      if (isMaster) {
          data.append('actualAttendance', '0');
      } else {
          // Validation for non-master programs
          if (!formData.actualAttendance) {
              alert("Please enter the actual attendance count.");
              setLoading(false);
              return;
          }
          data.append('actualAttendance', formData.actualAttendance);
      }

      data.append('startDate', formData.startDate);
      data.append('endDate', formData.endDate);
      data.append('driveLink', formData.driveLink);
      data.append('completionComment', formData.completionComment);
      
      if (file) data.append('finalDocument', file);

      await API.put(`/programs/${program._id}/complete`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert(isMaster ? "Series Concluded Successfully!" : "Program Marked as Complete!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to complete program.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-800 transition-colors duration-300">
        
        <div className="flex justify-between items-start mb-6">
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <CheckCircle size={24} className="text-emerald-500"/> 
                    {isMaster ? "Conclude Series" : "Complete Program"}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                    {isMaster 
                        ? "Close this series. No further batches can be created." 
                        : "Upload final details to close this program."}
                </p>
            </div>
            <button onClick={onClose} className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <X size={18} className="text-gray-500 dark:text-gray-400"/>
            </button>
        </div>

        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                {/* ✅ CONDITION: Only show Attendance for Instances/One-Time */}
                {!isMaster && (
                    <div className="col-span-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Actual Attendance</label>
                        <input 
                            type="number" 
                            value={formData.actualAttendance} 
                            onChange={e => setFormData({...formData, actualAttendance: e.target.value})} 
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 outline-none text-sm font-bold text-gray-800 dark:text-white mt-1 focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors" 
                            placeholder="e.g. 45"
                        />
                    </div>
                )}

                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Start Date</label>
                    <input 
                        type="date" 
                        value={formData.startDate} 
                        onChange={e => setFormData({...formData, startDate: e.target.value})} 
                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 outline-none text-sm font-bold text-gray-800 dark:text-white mt-1 focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">End Date</label>
                    <input 
                        type="date" 
                        value={formData.endDate} 
                        onChange={e => setFormData({...formData, endDate: e.target.value})} 
                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 outline-none text-sm font-bold text-gray-800 dark:text-white mt-1 focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors"
                    />
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Google Drive Link (Media)</label>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 mt-1 focus-within:border-emerald-500 dark:focus-within:border-emerald-500 transition-colors">
                    <Link size={16} className="text-gray-400 dark:text-gray-500"/>
                    <input 
                        value={formData.driveLink} 
                        onChange={e => setFormData({...formData, driveLink: e.target.value})} 
                        className="bg-transparent w-full outline-none text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-600" 
                        placeholder="https://..."
                    />
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Completion Comment</label>
                <div className="flex items-start gap-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 mt-1 focus-within:border-emerald-500 dark:focus-within:border-emerald-500 transition-colors">
                    <MessageSquare size={16} className="text-gray-400 dark:text-gray-500 mt-1"/>
                    <textarea 
                        value={formData.completionComment} 
                        onChange={e => setFormData({...formData, completionComment: e.target.value})} 
                        className="bg-transparent w-full outline-none text-sm resize-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-600" 
                        rows="2" 
                        placeholder="Summary of outcome..."
                    />
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Final Report (PDF)</label>
                <div className="mt-1 relative group">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors">
                        <Upload size={18} className="text-gray-400 dark:text-gray-500 group-hover:text-emerald-500"/>
                        <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 font-medium truncate">
                            {file ? file.name : "Click to upload report"}
                        </span>
                    </div>
                    <input type="file" accept=".pdf,.doc,.docx" onChange={e => setFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer"/>
                </div>
            </div>
        </div>

        <button 
            onClick={handleSubmit} 
            disabled={loading} 
            className="w-full mt-6 bg-gray-900 dark:bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-black dark:hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg dark:shadow-none"
        >
            {loading ? <><Loader2 className="animate-spin" size={18}/> Saving...</> : (isMaster ? 'Conclude Series' : 'Confirm Completion')}
        </button>
      </div>
    </div>
  );
};

export default CompleteProgramModal;