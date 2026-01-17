import { useState } from 'react';
import API from '../services/api';
import { X, CheckCircle, Upload, Image, Users, Calendar, Loader2, Link as LinkIcon } from 'lucide-react';

const CompleteProgramModal = ({ isOpen, onClose, program, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    actualAttendance: '',
    startDate: program?.date ? new Date(program.date).toISOString().slice(0,16) : '',
    endDate: '',
    driveLink: ''
  });
  const [file, setFile] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use FormData for file upload
      const data = new FormData();
      data.append('actualAttendance', formData.actualAttendance);
      data.append('startDate', formData.startDate);
      data.append('endDate', formData.endDate);
      data.append('driveLink', formData.driveLink);
      if (file) {
          data.append('finalDocument', file);
      }

      await API.put(`/programs/${program._id}/complete`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert("Program marked as Completed! 🎉");
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to complete program");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <div>
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <CheckCircle size={20} className="text-emerald-600"/> Mark as Complete
                </h3>
                <p className="text-xs text-gray-500">Finalize program details & reports.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X size={18} className="text-gray-500"/>
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
            
            {/* 1. Attendance */}
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                    <Users size={14}/> Total Attendees
                </label>
                <input 
                    type="number" required min="0"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:border-emerald-500 outline-none"
                    placeholder="e.g. 150"
                    value={formData.actualAttendance}
                    onChange={(e) => setFormData({...formData, actualAttendance: e.target.value})}
                />
            </div>

            {/* 2. Dates */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                        <Calendar size={14}/> Started At
                    </label>
                    <input 
                        type="datetime-local" required
                        className="w-full p-3 border border-gray-200 rounded-xl focus:border-emerald-500 outline-none text-sm"
                        value={formData.startDate}
                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                        <Calendar size={14}/> Ended At
                    </label>
                    <input 
                        type="datetime-local" required
                        className="w-full p-3 border border-gray-200 rounded-xl focus:border-emerald-500 outline-none text-sm"
                        value={formData.endDate}
                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    />
                </div>
            </div>

            {/* 3. Media Link */}
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                    <Image size={14}/> Event Photos (Drive Link)
                </label>
                <div className="relative">
                    <LinkIcon size={16} className="absolute left-3 top-3.5 text-gray-400"/>
                    <input 
                        type="url" required
                        className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:border-emerald-500 outline-none placeholder:text-gray-300"
                        placeholder="https://drive.google.com/..."
                        value={formData.driveLink}
                        onChange={(e) => setFormData({...formData, driveLink: e.target.value})}
                    />
                </div>
            </div>

            {/* 4. Upload Document */}
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                    <Upload size={14}/> Upload Final Report
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                    <input 
                        type="file" accept=".pdf,.doc,.docx" required
                        onChange={(e) => setFile(e.target.files[0])}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center gap-2">
                        {file ? (
                            <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-sm font-bold truncate max-w-full">
                                {file.name}
                            </div>
                        ) : (
                            <>
                                <Upload size={24} className="text-gray-300"/>
                                <span className="text-sm text-gray-400">Click to upload PDF or Doc</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-200"
            >
                {loading ? <Loader2 className="animate-spin"/> : <CheckCircle size={18}/>}
                Confirm Completion
            </button>

        </form>
      </div>
    </div>
  );
};

export default CompleteProgramModal;