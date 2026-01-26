import { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api'; // Ensure this points to your axios instance
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await API.post('/auth/forgot-password', { email });
      setStatus('success');
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Check your email</h2>
          <p className="text-gray-500 mb-8">
            We sent a password reset link to <br/>
            <strong className="text-gray-800">{email}</strong>
          </p>
          <Link to="/login" className="text-emerald-600 font-bold hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Link to="/login" className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-6 text-sm font-bold transition-colors">
            <ArrowLeft size={16}/> Back
        </Link>
        
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Forgot Password?</h2>
          <p className="text-gray-500">No worries! Enter your email and we will send you reset instructions.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Email Address</label>
            <div className="relative group">
                <Mail className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-gray-700 placeholder-gray-400"
                  placeholder="name@example.com"
                />
            </div>
          </div>

          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-500 text-sm font-bold bg-red-50 p-4 rounded-xl border border-red-100 animate-in shake">
              <AlertCircle size={18} />
              <span>User not found or email failed to send.</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={status === 'loading'}
            className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Sending Link...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;