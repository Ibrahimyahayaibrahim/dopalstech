import { useState, useEffect } from 'react';
import { X, Building2, User, Loader2, ChevronDown } from 'lucide-react';
import API from '../services/api';

const AddDepartmentModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ name: '', headOfDepartment: '', description: '' });
  const [isCustomName, setIsCustomName] = useState(false);
  const [staffList, setStaffList] = useState([]); // Store list of users
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch Users when modal opens
  useEffect(() => {
    if (isOpen) {
        const fetchUsers = async () => {
            try {
                // Ensure you have a route GET /users in your backend
                const { data } = await API.get('/users'); 
                setStaffList(data);
            } catch (err) {
                console.error("Failed to load staff list", err);
            }
        };
        fetchUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectChange = (e) => {
    const value = e.target.value;
    if (value === 'Other') {
      setIsCustomName(true);
      setFormData({ ...formData, name: '' });
    } else {
      setIsCustomName(false);
      setFormData({ ...formData, name: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await API.post('/departments', formData);
      alert('Department Created Successfully! 🎉');
      setFormData({ name: '', headOfDepartment: '', description: '' });
      setIsCustomName(false);
      onSuccess(); 
      onClose();   
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create department';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in">
      <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl relative">
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
            <Building2 size={24} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Add Department</h2>
          <p className="text-gray-500 text-sm">Create a new sector in your organization.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-2">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Department Name */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Department Name</label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all bg-white mb-2 appearance-none"
              onChange={handleSelectChange}
              defaultValue=""
            >
              <option value="" disabled>Select a Department...</option>
              <option value="Capacity Building">Capacity Building</option>
              <option value="Start-up Support">Start-up Support</option>
              <option value="Co-working Space">Co-working Space</option>
              <option value="Financial">Financial</option>
              <option value="Marketing">Marketing</option>
              <option value="Other" className="font-bold text-emerald-600">+ Type Custom Name</option>
            </select>

            {isCustomName && (
              <input 
                type="text" 
                required
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-emerald-500 ring-4 ring-emerald-500/10 outline-none transition-all animate-in fade-in"
                placeholder="Type custom name here..."
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            )}
          </div>

          {/* Head of Department (Dropdown) */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Head of Department / First Staff</label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-3.5 text-gray-400 pointer-events-none" />
              <ChevronDown size={18} className="absolute right-4 top-3.5 text-gray-400 pointer-events-none" />
              <select 
                className="w-full pl-11 pr-10 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all bg-white appearance-none cursor-pointer"
                value={formData.headOfDepartment}
                onChange={(e) => setFormData({...formData, headOfDepartment: e.target.value})}
              >
                <option value="">-- Select Staff Member --</option>
                {staffList.length > 0 ? (
                    staffList.map(user => (
                        <option key={user._id} value={user._id}>
                            {user.name} ({user.email})
                        </option>
                    ))
                ) : (
                    <option disabled>Loading users...</option>
                )}
              </select>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 ml-1">Selected user will be automatically added to this department.</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
            <textarea 
              rows="3"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all resize-none"
              placeholder="Brief description..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-200 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20}/> : null}
            {loading ? 'Creating...' : 'Create Department'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default AddDepartmentModal;