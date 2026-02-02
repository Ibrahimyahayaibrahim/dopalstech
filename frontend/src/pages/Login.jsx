import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import logo from '../assets/logo.png'; // Ensure you have your logo here

const Login = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await API.post('/auth/login', formData);
      
      // 1. Save Token & User Info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));

      // 2. Dispatch event for other components (like Sidebar) to update
      window.dispatchEvent(new Event('storage'));

      // 3. Logic: If profile is not complete (New User), go to Settings
      if (data.status === 'Pending' || !data.isProfileComplete) {
          navigate('/dashboard?tab=settings'); 
      } else {
          navigate('/dashboard');
      }

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl p-8 md:p-10 border border-white/50 dark:border-gray-700 relative overflow-hidden">
        
        {/* Background Blob */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-emerald-100 dark:border-emerald-800 transform hover:rotate-12 transition-transform duration-300">
            <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Welcome Back</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium">Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl border border-red-100 dark:border-red-800 animate-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0"/>
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
              <input 
                type="email" 
                required
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:focus:ring-emerald-900/30 transition-all font-bold text-gray-800 dark:text-white placeholder-gray-400"
                placeholder="name@company.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                className="w-full pl-12 pr-12 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:focus:ring-emerald-900/30 transition-all font-bold text-gray-800 dark:text-white placeholder-gray-400"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
              </button>
            </div>
            <div className="flex justify-end mt-2">
              <Link to="/forgot-password" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
                Forgot Password?
              </Link>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-emerald-200/40 dark:shadow-none disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={24}/> : <>Sign In <ArrowRight size={20}/></>}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Dopals Technologies</p>
        </div>
      </div>
    </div>
  );
};

export default Login;