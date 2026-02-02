import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api'; 
import { Lock, CheckCircle, Loader2 } from 'lucide-react';
import { useUI } from '../context/UIContext'; // ✅ Import Context

const ChangePassword = () => {
  const navigate = useNavigate();
  const { showToast } = useUI(); // ✅ Hook
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      // ✅ Replaced Alert
      showToast("Passwords do not match!", "error");
      return;
    }
    if (passwords.newPassword.length < 6) {
      // ✅ Replaced Alert
      showToast("Password must be at least 6 characters.", "warning");
      return;
    }

    setLoading(true);
    try {
      const { data } = await API.put('/users/profile', {
        password: passwords.newPassword,
        status: 'Onboarding'
      });

      const updatedUser = { ...data, status: 'Onboarding' };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // ✅ Success Toast
      showToast("Password updated successfully!", "success");

      navigate('/complete-profile');
      
    } catch (err) {
      console.error(err);
      // ✅ Error Toast
      showToast(err.response?.data?.message || "Failed to update password", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... (Keep existing JSX) ...
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full p-8 rounded-3xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Secure Your Account</h2>
          <p className="text-gray-500 mt-2 text-sm">
            Please change your temporary password to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Password</label>
            <input 
              type="password" required
              className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-red-500 transition-all"
              onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirm Password</label>
            <input 
              type="password" required
              className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-red-500 transition-all"
              onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-red-600 text-white py-3.5 rounded-xl font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin"/> : <CheckCircle size={20}/>}
            Update & Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;