import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../services/api';
import { Building2, Users, LayoutGrid, ArrowRight, Loader2, Lock } from 'lucide-react';

const Departments = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Get User Info safely
  const user = JSON.parse(localStorage.getItem('user')) || {};

  // Helper: Check if a department belongs to the user
  // Handles cases where department list contains Objects OR just ID strings
  const isMyDepartment = (deptId) => {
    if (!user?.departments) return false;
    return user.departments.some(d => (d._id || d) === deptId);
  };

  // =========================================================
  // ✅ 1. SMART REDIRECT LOGIC
  // =========================================================
  useEffect(() => {
    const shouldShowAll = searchParams.get('view') === 'all';
    
    // Check if user exists and has departments
    if (user && user.departments && user.departments.length > 0) {
        // If User is NOT Super Admin AND has exactly 1 Department
        if (user.role !== 'SUPER_ADMIN' && user.departments.length === 1 && !shouldShowAll) {
            const myDeptId = user.departments[0]._id || user.departments[0];
            navigate(`/departments/${myDeptId}`, { replace: true });
        }
    }
  }, [user, navigate, searchParams]);

  // 2. Fetch ALL Departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const { data } = await API.get('/departments');
        setDepartments(data);
      } catch (error) {
        console.error("Failed to load departments", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  // =========================================================
  // ✅ 2. FILTER LOGIC (The Fix)
  // =========================================================
  // If Super Admin: Show ALL. 
  // If Staff: Show ONLY their departments.
  const visibleDepartments = user.role === 'SUPER_ADMIN' 
    ? departments 
    : departments.filter(dept => isMyDepartment(dept._id));


  if (loading) return (
    <div className="flex h-screen items-center justify-center text-emerald-600">
        <Loader2 className="animate-spin" size={40} />
    </div>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen animate-in fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
            {user.role === 'SUPER_ADMIN' ? 'All Departments' : 'My Departments'}
        </h1>
        <p className="text-gray-500 mt-2">
            {user.role === 'SUPER_ADMIN' ? 'Manage organization structure.' : 'Select a department to manage.'}
        </p>
      </div>

      {/* Grid: Shows FILTERED Departments */}
      {visibleDepartments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleDepartments.map((dept) => {
              return (
                <div 
                  key={dept._id} 
                  onClick={() => navigate(`/departments/${dept._id}`)}
                  className="p-6 rounded-2xl bg-white border border-emerald-200 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white">
                          <Building2 size={24} />
                      </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 mb-2">{dept.name}</h3>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-6 h-10">{dept.description || 'No description provided.'}</p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                          <span className="flex items-center gap-1"><LayoutGrid size={14}/> {dept.programCount || 0} Programs</span>
                      </div>
                      <ArrowRight size={18} className="text-emerald-400 group-hover:text-emerald-600 transform group-hover:translate-x-1 transition-all"/>
                  </div>
                </div>
              );
            })}
          </div>
      ) : (
        // Fallback if user has NO departments assigned
        <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-gray-200 rounded-2xl">
            <Lock className="text-gray-300 mb-3" size={48} />
            <h3 className="text-lg font-semibold text-gray-600">No Access Assigned</h3>
            <p className="text-gray-400">You have not been assigned to any department yet.</p>
        </div>
      )}
    </div>
  );
};

export default Departments;