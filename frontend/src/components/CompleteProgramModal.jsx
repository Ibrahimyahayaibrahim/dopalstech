import React, { useState } from 'react';
import API from '../services/api';
import { X, CheckCircle, Upload, Link, MessageSquare } from 'lucide-react';

const CompleteProgramModal = ({ isOpen, onClose, program, onSuccess }) => {
  const [formData, setFormData] = useState({
    actualAttendance: '',
    startDate: program?.date?.split('T')[0] || '',
    endDate: '',
    driveLink: '',
    completionComment: '' // ✅ NEW: Comment Field
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (file) data.append('finalDocument', file);

      await API.put(`/programs/${program._id}/complete`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert("Program marked as Completed!");
      onSuccess();
      onClose();
    } catch (error) {
      alert("Failed to complete program.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in zoom-in">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle className="text-emerald-500"/> Complete Program
            </h2>
            <button onClick={onClose}><X size={20} className="text-gray-400"/></button>
        </div>

        <div className="space-y-4">
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Actual Attendance</label>
                <input type="number" value={formData.actualAttendance} onChange={e => setFormData({...formData, actualAttendance: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 font-bold"/>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Start Date</label>
                    <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none text-sm"/>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">End Date</label>
                    <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none text-sm"/>
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Media / Drive Link</label>
                <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <Link size={16} className="text-gray-400"/>
                    <input value={formData.driveLink} onChange={e => setFormData({...formData, driveLink: e.target.value})} className="bg-transparent w-full outline-none text-sm" placeholder="https://..."/>
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Completion Comment / Remark</label>
                <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <MessageSquare size={16} className="text-gray-400 mt-1"/>
                    <textarea value={formData.completionComment} onChange={e => setFormData({...formData, completionComment: e.target.value})} className="bg-transparent w-full outline-none text-sm resize-none" rows="2" placeholder="Summary of how it went..."/>
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Final Report (PDF)</label>
                <input type="file" accept=".pdf,.doc" onChange={e => setFile(e.target.files[0])} className="w-full text-sm text-gray-500 mt-1"/>
            </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} className="w-full mt-6 bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-all">
            {loading ? 'Saving...' : 'Confirm Completion'}
        </button>
      </div>
    </div>
  );
};

export default CompleteProgramModal;