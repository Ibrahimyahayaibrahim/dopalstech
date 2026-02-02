import { useState, useEffect } from 'react'; // ✅ Import useEffect
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { Mail, Lock, Loader, ArrowRight, AlertCircle } from 'lucide-react';
import logo from '../assets/logo.png'; 
import { useUI } from '../context/UIContext';

const Login = () => {
  const { showToast } = useUI();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ REDIRECT IF ALREADY LOGGED IN
  useEffect(() => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (user && token) {
      navigate('/dashboard'); 
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await API.post('/auth/login', { email, password });
      
      localStorage.setItem('user', JSON.stringify(data));
      if (data.token) localStorage.setItem('token', data.token);
      
      showToast("Login Successful! Welcome back.", "success");
      navigate('/dashboard');
      
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed. Please check your credentials.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full font-sans bg-white dark:bg-gray-900 transition-colors duration-300">
      
      {/* --- LEFT SIDE: BRANDING --- */}
      <div className="hidden lg:flex w-1/2 bg-emerald-900 flex-col items-center justify-center p-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
            <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-emerald-500 rounded-full blur-[150px]"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-emerald-600 rounded-full blur-[150px]"></div>
        </div>

        <div className="relative z-10 animate-in slide-in-from-left-10 duration-700">
            <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mb-8 mx-auto border border-white/20 shadow-2xl">
                <img src={logo} alt="Logo" className="w-14 h-14 object-contain drop-shadow-lg" />
            </div>
            <h1 className="text-5xl font-extrabold text-white mb-6 tracking-tight">Dopals Tech</h1>
            <p className="text-emerald-100 text-lg max-w-md mx-auto leading-relaxed">
                Manage your organization's hierarchy, staff, and programs with our secure, next-generation admin portal.
            </p>
        </div>
      </div>

      {/* --- RIGHT SIDE: FORM --- */}
      <div className="w-full lg:w-1/2 bg-white dark:bg-gray-900 flex flex-col justify-center px-8 md:px-24 py-12 relative transition-colors duration-300">
        <div className="max-w-md w-full mx-auto animate-in fade-in zoom-in duration-500">
            
            <div className="mb-10">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">Welcome Back</h2>
                <p className="text-gray-500 dark:text-gray-400 transition-colors">Please enter your details to sign in.</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl flex items-center gap-3 border border-red-100 dark:border-red-900/50 animate-pulse transition-colors">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
                <div>
                    <label className="block text-xs font-bold text-gray-900 dark:text-gray-300 mb-2 transition-colors">Email Address</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-3.5 text-gray-400 dark:text-gray-500 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-500 transition-colors" size={20} />
                        <input 
                            type="email" 
                            required
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 dark:focus:ring-emerald-900/30 transition-all font-medium text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                            placeholder="name@dopalstech.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-900 dark:text-gray-300 mb-2 transition-colors">Password</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-3.5 text-gray-400 dark:text-gray-500 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-500 transition-colors" size={20} />
                        <input 
                            type="password" 
                            required
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 dark:focus:ring-emerald-900/30 transition-all font-medium text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <Link 
                        to="/forgot-password" 
                        className="text-sm font-bold text-emerald-600 dark:text-emerald-500 hover:text-emerald-800 dark:hover:text-emerald-400 hover:underline transition-all"
                    >
                        Forgot Password?
                    </Link>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold text-lg active:scale-[0.98] transition-all shadow-lg shadow-emerald-200/50 dark:shadow-none disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                    {loading ? <Loader size={20} className="animate-spin" /> : (
                        <>
                           Sign In <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                        </>
                    )}
                </button>
            </form>
            
            <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-600 transition-colors">
                © 2026 Dopals Technologies. All rights reserved.
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;