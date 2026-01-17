import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CompleteProfileModal from '../components/CompleteProfileModal';
import logo from '../assets/logo.png'; // Ensure path is correct

const OnboardingPage = () => {
  const navigate = useNavigate();
  // Get user safely from storage
  const [user, setUser] = useState(() => {
      try { return JSON.parse(localStorage.getItem('user')); } catch (e) { return null; }
  });

  // Handle successful update from the Modal
  const handleUpdate = (updatedUser) => {
      // 1. Update Local State
      setUser(updatedUser);
      // 2. Update Storage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      // 3. FORCE NAVIGATION to Dashboard (now that they are Active)
      // We use window.location.reload() or navigate(0) to ensure Router picks up the new status
      window.location.href = '/dashboard';
  };

  // If user somehow gets here but is already active, kick them to dashboard
  useEffect(() => {
      if (user?.isProfileComplete) {
          navigate('/dashboard');
      }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-emerald-950 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-400 rounded-full blur-[150px]"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500 rounded-full blur-[150px]"></div>
        </div>

        {/* Brand Header */}
        <div className="relative z-10 mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-2xl">
                <img src={logo} alt="Dopals" className="w-12 h-12 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Welcome Aboard!</h1>
            <p className="text-emerald-200 mt-2 text-sm">Let's get your account set up properly.</p>
        </div>

        {/* The Modal Component (Rendered directly) */}
        {user && (
            <CompleteProfileModal 
                user={user} 
                onClose={() => {}} // Empty function ensures they CANNOT close it without finishing
                onUpdate={handleUpdate} 
            />
        )}
    </div>
  );
};

export default OnboardingPage;