import React, { useState } from 'react';
import API from '../services/api';
import { X, UserPlus } from 'lucide-react';
import { useUI } from '../context/UIContext';

const AddParticipantModal = ({ isOpen, onClose, programId, onSuccess }) => {
  const { showToast } = useUI();
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await API.post(`/programs/${programId}/participants/add`, formData);
      showToast("Participant added successfully!", "success");
      onSuccess();
      onClose();
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to add participant.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* ✅ Dark Mode Container */}
      <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl shadow-xl p-6 border border-gray-100 dark:border-gray-800 transition-colors duration-300">
        
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <UserPlus size={20} className="text-emerald-500"/> Add Participant
            </h2>
            <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"/></button>
        </div>

        <div className="space-y-4">
            <input 
              placeholder="Full Name" 
              value={formData.fullName} 
              onChange={e => setFormData({...formData, fullName: e.target.value})} 
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 outline-none focus:border-emerald-500 transition-colors"
            />
            <input 
              placeholder="Email Address" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 outline-none focus:border-emerald-500 transition-colors"
            />
            <input 
              placeholder="Phone Number" 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 outline-none focus:border-emerald-500 transition-colors"
            />
            
            <button 
              onClick={handleSubmit} 
              disabled={loading} 
              className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200/50 dark:shadow-none transition-all disabled:opacity-50"
            >
                {loading ? 'Adding...' : 'Add Attendee'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AddParticipantModal;