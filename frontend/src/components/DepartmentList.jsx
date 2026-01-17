import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';
import { Building2, ArrowRight, Loader2, Lock, ArrowLeft, Globe, Users, LayoutGrid, Plus, Trash2 } from 'lucide-react';
import AddDepartmentModal from './AddDepartmentModal'; 

const DepartmentList = ({ mode = 'MY' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); 
  
  // --- PERMISSIONS ---
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const isSuperAdmin = user.role === 'SUPER_ADMIN'; 
  const isViewingAll = location.pathname.includes('/all') || mode === 'ALL';

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/departments?_nocache=${Date.now()}`);
      
      if (isViewingAll) {
           setDepartments(data);
      } else {
           const myDepts = data.filter(dept => 
              user.departments?.some(userDept => (userDept._id || userDept) === dept._id)
           );
           setDepartments(myDepts);
      }

    } catch (error) {
      console.error("Fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If Super Admin lands on "My Depts" (default), redirect them to "All" immediately
    if (isSuperAdmin && !isViewingAll) {
        navigate('/departments/all', { replace: true });
        return;
    }
    fetchData();
  }, [isViewingAll, isSuperAdmin, navigate]); 

  // --- DELETE FUNCTION ---
  const handleDelete = async (id, name) => {
      if(!window.confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) return;
      
      try {
          await API.delete(`/departments/${id}`);
          alert("Department deleted successfully.");
          fetchData(); 
      } catch (error) {
          console.error(error);
          alert(error.response?.data?.message || "Failed to delete department.");
      }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center text-emerald-600">
        <Loader2 className="animate-spin" size={40} />
    </div>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen animate-in fade-in">
      
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <button 
            onClick={() => navigate('/dashboard')} 
            className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors font-semibold"
        >
            <ArrowLeft size={20} />
            Back to Dashboard
        </button>

        <div className="flex gap-3">
            {/* CREATE BUTTON: Only visible to Super Admin */}
            {isSuperAdmin && (
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"
                >
                    <Plus size={18} /> Create Dept
                </button>
            )}

            <div className="flex gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                
                {/* ✅ UPDATED: Hide 'My Depts' button for Super Admin */}
                {!isSuperAdmin && (
                    <button
                        onClick={() => navigate('/departments/my')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all
                        ${!isViewingAll 
                            ? 'bg-emerald-100 text-emerald-700 shadow-sm' 
                            : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Users size={16} /> My Depts
                    </button>
                )}

                <button
                    onClick={() => navigate('/departments/all')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all
                    ${isViewingAll 
                        ? 'bg-emerald-100 text-emerald-700 shadow-sm' 
                        : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <Globe size={16} /> View All
                </button>
            </div>
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
            {isViewingAll ? 'Organization Directory' : 'My Departments'}
        </h1>
        <p className="text-gray-500 mt-2">
            {isViewingAll 
                ? 'Viewing all departments in the organization.' 
                : 'Departments you are currently assigned to.'}
        </p>
      </div>

      {departments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept) => (
            <div 
                key={dept._id} 
                onClick={() => navigate(`/departments/${dept._id}`)}
                className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 cursor-pointer transition-all group relative overflow-hidden flex flex-col justify-between"
            >
                {/* DELETE BUTTON: Only visible to Super Admin */}
                {isSuperAdmin && (
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            handleDelete(dept._id, dept.name); 
                        }}
                        className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all z-10"
                        title="Delete Department"
                    >
                        <Trash2 size={18} />
                    </button>
                )}

                <div>
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <Building2 size={24} />
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 mb-2 pr-8">{dept.name}</h3>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-6 h-10">
                        {dept.description || 'No description provided.'}
                    </p>
                </div>

                {/* Footer Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-2">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400" title="Programs">
                            <LayoutGrid size={14} /> 
                            {dept.programs?.length || dept.programCount || 0}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400" title="Staff Members">
                            <Users size={14} /> 
                            {dept.staffCount || 0}
                        </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-500 group-hover:translate-x-1 transition-transform">
                        View Details <ArrowRight size={14}/>
                    </div>
                </div>
            </div>
            ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-gray-200 rounded-2xl">
            <Lock className="text-gray-300 mb-3" size={48} />
            <h3 className="text-lg font-semibold text-gray-600">
                {isViewingAll ? 'No Departments Found' : 'No Access Assigned'}
            </h3>
            <p className="text-gray-400 max-w-md mt-1 mb-4">
                {isViewingAll 
                    ? 'The organization structure is currently empty.' 
                    : 'You are not assigned to any department.'}
            </p>
            {isSuperAdmin && isViewingAll && (
                 <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700"
                >
                    Create First Department
                </button>
            )}
        </div>
      )}

      <AddDepartmentModal 
         isOpen={isCreateModalOpen} 
         onClose={() => setIsCreateModalOpen(false)} 
         onSuccess={fetchData} 
      />

    </div>
  );
};

export default DepartmentList;