import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// ✅ IMPORT THE UI PROVIDER (New)
import { UIProvider } from './context/UIContext';

import { runDoctor } from './utils/doctor';
import { useEffect } from 'react';
// --- PAGES ---
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword'; 
import ResetPassword from './pages/ResetPassword';   
import AdminDashboard from './pages/AdminDashboard';
import DepartmentDetails from './pages/DepartmentDetails';
import ProgramDetails from './pages/ProgramDetails'; 
import PublicRegistration from './pages/PublicRegistration'; 

// --- COMPONENTS ---
import DepartmentDispatcher from './components/DepartmentDispatcher'; 
import DepartmentList from './components/DepartmentList'; 
import ProtectedRoute from './components/ProtectedRoute';

function App() {

// Attach Doctor to Window
  useEffect(() => {
    window.runDoctor = runDoctor;
  }, []);

  return (
    // ✅ WRAP THE APP IN UIProvider
    <UIProvider>
      <Router>
        <Routes>
          
          {/* --- 1. PUBLIC ROUTES (Accessible by anyone) --- */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
          
          {/* Link format: http://localhost:5173/register/some-slug-123 */}
          <Route path="/register/:id" element={<PublicRegistration />} />

          {/* --- 2. PROTECTED ROUTES (Require Login) --- */}
          <Route element={<ProtectedRoute />}>
              
              {/* Core App */}
              <Route path="/dashboard" element={<AdminDashboard />} />
              
              {/* Department Logic */}
              <Route path="/departments" element={<DepartmentDispatcher />} />
              <Route path="/departments/all" element={<DepartmentList mode="ALL" />} />
              <Route path="/departments/my" element={<DepartmentList mode="MY" />} />
              <Route path="/departments/empty" element={<DepartmentList mode="MY" />} />
              <Route path="/departments/:id" element={<DepartmentDetails />} />

              {/* Programs */}
              <Route path="/programs/:id" element={<ProgramDetails />} />

          </Route>

          {/* --- 3. CATCH-ALL --- */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Router>
    </UIProvider>
  );
}

export default App;