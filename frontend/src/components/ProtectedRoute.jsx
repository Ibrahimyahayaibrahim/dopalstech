import { Navigate, Outlet } from 'react-router-dom';
import OnboardingPage from '../pages/OnboardingPage';

const ProtectedRoute = () => {
  const user = JSON.parse(localStorage.getItem('user')); 

  // 1. Check if User is Logged In
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. THE GATEKEEPER (Fixed)
  // OLD LOGIC (Bad): Navigate('/complete-profile') -> Causes Loop
  // NEW LOGIC (Good): Just render the component right here.
  
  if (!user.isProfileComplete) {
      return <OnboardingPage />;
  }

  // 3. If Active & Complete, Open the Gates (Render Dashboard)
  return <Outlet />;
};

export default ProtectedRoute;