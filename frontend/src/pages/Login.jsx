import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api'; // Ensure this path is correct for your project
import logo from '../assets/logo.png'; // Ensure this path matches your logo location
import { Mail, Lock, Loader, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Send Login Request
      const response = await API.post('/auth/login', { email, password });
      
      // 2. Extract Data
      // The backend sends the user object directly in response.data
      const userData = response.data;

      // 3. Save to Local Storage
      // We strictly stringify the entire object so the rest of the app can use it
      localStorage.setItem('user', JSON.stringify(userData));
      
      // 4. Handle Token (If your API setup needs it separately)
      if (userData.token) {
          localStorage.setItem('token', userData.token);
      }

      // 5. Navigate
      // We always go to /dashboard. 
      // The ProtectedRoute will see the 'isProfileComplete' flag 
      // and decide whether to show the Dashboard or the Onboarding Page.
      navigate('/dashboard');

    } catch (err) {
      console.error("Login Error:", err);
      setError(
        err.response?.data?.message || 
        "Failed to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-emerald-950 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-[-50%] left-[-50%] w-full h-full bg-emerald-500 rounded-full blur-[100px]"></div>
            </div>
            <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/20 shadow-lg">
                    <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
                </div>
                <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
                <p className="text-emerald-200/80 text-sm mt-1">Sign in to access your dashboard</p>
            </div>
        </div>

        {/* Form Section */}
        <div className="p-8">
            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl flex items-center gap-3 animate-pulse border border-red-100">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
                        <input 
                            type="email" 
                            required
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all font-medium text-gray-700 bg-gray-50/50 focus:bg-white"
                            placeholder="name@dopalstech.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                        <input 
                            type="password" 
                            required
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all font-medium text-gray-700 bg-gray-50/50 focus:bg-white"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                >
                    {loading ? <Loader className="animate-spin" size={20} /> : "Sign In"}
                </button>
            </form>
        </div>
        
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
            <p className="text-xs text-gray-400 font-medium">© 2025 Dopals Technologies</p>
        </div>

      </div>
    </div>
  );
};

export default Login;