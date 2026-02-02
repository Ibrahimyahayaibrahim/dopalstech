import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';

// ✅ IMPORT CONTEXTS
import { UIProvider } from './context/UIContext';
import { ThemeProvider } from './context/ThemeContext'; // 👈 IMPORT THIS

import { runDoctor } from './utils/doctor';

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
    // ✅ WRAP THE APP IN PROVIDERS
    <UIProvider>
      <ThemeProvider> {/* 👈 WRAP HERE (Inside UIProvider) */}
        <Router>
          <Routes>
            
            {/* --- 1. PUBLIC ROUTES --- */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
            
            <Route path="/register/:id" element={<PublicRegistration />} />

            {/* --- 2. PROTECTED ROUTES --- */}
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
      </ThemeProvider>
    </UIProvider>
  );
}

export default App;