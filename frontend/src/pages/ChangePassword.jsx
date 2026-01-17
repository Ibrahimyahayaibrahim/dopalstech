import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api'; // Adjust path if needed
import { Lock, CheckCircle, Loader2 } from 'lucide-react';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return alert("Passwords do not match!");
    }
    if (passwords.newPassword.length < 6) {
      return alert("Password must be at least 6 characters.");
    }

    setLoading(true);
    try {
      // 1. Send Update to Backend
      const { data } = await API.put('/users/profile', {
        password: passwords.newPassword,
        status: 'Onboarding'
      });

      // 2. ✅ FORCE LOCAL UPDATE (The Fix)
      // Even if backend sends back 'Pending', we overwrite it here locally
      // so the router lets us pass to the next screen.
      const updatedUser = { ...data, status: 'Onboarding' };
      
      // 3. Save to Storage
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // 4. Redirect to Profile Completion
      navigate('/complete-profile');
      
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
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