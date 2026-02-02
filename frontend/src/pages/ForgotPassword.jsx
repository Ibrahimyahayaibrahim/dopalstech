import { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      // Calls the backend endpoint that uses Brevo
      await API.post('/auth/forgot-password', { email });
      setStatus('success');
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMessage(error.response?.data?.message || "Something went wrong. Please try again.");
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 text-center animate-in zoom-in duration-300 border border-gray-100 dark:border-gray-700">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Check your email</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            We have sent a password reset link to <strong>{email}</strong>.
          </p>
          <Link 
            to="/login" 
            className="block w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all"
          >
            Back to Login
          </Link>
          <button 
            onClick={() => setStatus('idle')} 
            className="mt-4 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-bold"
          >
            Didn't receive it? Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4">
        
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-6 transition-colors">
          <ArrowLeft size={16}/> Back to Login
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Forgot Password?</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:focus:ring-emerald-900/30 transition-all font-medium text-gray-900 dark:text-white placeholder-gray-400"
                placeholder="name@company.com"
              />
            </div>
          </div>

          {status === 'error' && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl border border-red-100 dark:border-red-800 animate-pulse">
              {errorMessage}
            </div>
          )}

          <button 
            type="submit" 
            disabled={status === 'loading'}
            className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-200/50 dark:shadow-none disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {status === 'loading' ? <Loader2 className="animate-spin" size={20}/> : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;