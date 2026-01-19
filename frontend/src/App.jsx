import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- PAGES ---
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import DepartmentDetails from './pages/DepartmentDetails';
import ProgramDetails from './pages/ProgramDetails'; 
import PublicRegistration from './pages/PublicRegistration'; 

// --- COMPONENTS ---
import DepartmentDispatcher from './components/DepartmentDispatcher'; 
import DepartmentList from './components/DepartmentList'; 
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        
        {/* --- 1. PUBLIC ROUTES (Accessible by anyone) --- */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        
        {/* ✅ FIXED: Removed '/program' to match your generated links */}
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
  );
}

export default App;