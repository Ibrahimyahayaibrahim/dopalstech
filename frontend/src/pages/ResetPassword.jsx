import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

const ResetPassword = () => {
  const { resetToken } = useParams(); // Must match the route param in App.jsx
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [status, setStatus] = useState('idle'); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    setStatus('loading');
    try {
      // Calls the backend endpoint: PUT /api/auth/reset-password/:token
      await API.put(`/auth/reset-password/${resetToken}`, { password });
      setStatus('success');
      
      // Auto-redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000); 
    } catch (error) {
      setStatus('error');
    }
  };

  if (status === 'success') {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
              <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center animate-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Password Reset!</h2>
                  <p className="text-gray-500">Your password has been updated successfully.<br/>Redirecting to login...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8 text-center">
            <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Set New Password</h2>
            <p className="text-gray-500 text-sm">Your new password must be different from previously used passwords.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">New Password</label>
            <div className="relative group">
                <Lock className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input 
                  type={showPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-gray-700"
                  placeholder="••••••••"
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPass ? <EyeOff size={20}/> : <Eye size={20}/>}
                </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Confirm Password</label>
            <div className="relative group">
                <Lock className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input 
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-gray-700"
                  placeholder="••••••••"
                />
            </div>
          </div>

          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-500 text-sm font-bold bg-red-50 p-4 rounded-xl border border-red-100 animate-in shake">
              <AlertCircle size={18} />
              <span>Invalid or expired reset link.</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={status === 'loading'}
            className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-200 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {status === 'loading' ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;