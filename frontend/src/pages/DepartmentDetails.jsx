import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import AddProgramModal from '../components/AddProgramModal'; 
import EditProgramModal from '../components/EditProgramModal'; 
import CompleteProgramModal from '../components/CompleteProgramModal'; 
import AddStaffModal from '../components/AddStaffModal'; 
import { 
  ArrowLeft, LayoutGrid, Plus, User, Building2, Calendar, CheckCircle, 
  Clock, Shield, Briefcase, ArrowRightLeft, Trash2, Globe
} from 'lucide-react';

const DepartmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null); 
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false); 
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false); 
  const [selectedProgram, setSelectedProgram] = useState(null);

  // --- PERMISSION & SAFETY LOGIC ---
  let user = {};
  try {
      user = JSON.parse(localStorage.getItem('user')) || {};
  } catch (e) {
      console.error("User Data Error", e);
  }
  
  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  
  // CRASH FIX: Safe check for department membership
  const userDepts = Array.isArray(user.departments) ? user.departments.filter(Boolean) : [];
  const isMember = userDepts.some(dept => (dept._id || dept) === id);
  const isDeptAdmin = user.role === 'ADMIN' && isMember;

  // 1. Who can CREATE programs here? (Super Admin OR Any Member of this dept)
  const canCreateProgram = isSuperAdmin || isMember;

  // 2. Who can MANAGE staff? (Super Admin OR Dept Admin of this dept)
  const canManageStaff = isSuperAdmin || isDeptAdmin;

  const fetchAllData = async () => {
    try {
      const response = await API.get(`/departments/${id}`);
      setData(response.data); 
    } catch (err) { 
        console.error("Failed to fetch data", err); 
    } finally { 
        setLoading(false); 
    }
  };

  useEffect(() => { fetchAllData(); }, [id]);

  const handleRemoveStaff = async (userId, staffName) => {
      if(!window.confirm(`Are you sure you want to remove ${staffName} from this department?`)) return;
      try {
          await API.post('/users/remove-dept', { userId, departmentId: id });
          alert("Staff removed successfully.");
          fetchAllData(); 
      } catch(err) { 
          alert(err.response?.data?.message || "Failed to remove staff."); 
      }
  };

  const handleMigrateStaff = async (userId, staffName) => {
      const newDeptId = prompt(`Enter the ID of the new department for ${staffName}:`);
      if(!newDeptId) return;

      try {
          await API.post('/users/migrate', { userId, oldDeptId: id, newDeptId });
          alert("Staff migrated successfully!");
          fetchAllData();
      } catch(err) { 
          alert(err.response?.data?.message || "Failed to migrate staff."); 
      }
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-emerald-600 font-bold">Loading Details...</div>;
  if (!data) return <div className="p-10 text-center text-red-500 font-bold">Department Not Found</div>;

  const { department, staff, programs: fetchedPrograms } = data;
  const name = department?.name || "Unnamed Department";
  const description = department?.description || "No description available.";
  const programs = fetchedPrograms || []; 
  
  // CRASH FIX: Filter out null staff entries before finding admin
  const staffList = (staff || []).filter(Boolean); 
  const departmentHead = staffList.find(member => member.role === 'ADMIN');

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen font-sans animate-in fade-in">
      
      {/* Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors font-medium">
            <ArrowLeft size={18} /> Back to Dashboard
          </button>

          <div className="flex gap-3">
             <button onClick={() => navigate('/departments')} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-50 hover:text-emerald-700 transition-all shadow-sm">
                <Globe size={16} /> View All Depts
            </button>
          </div>
      </div>

      {/* Header Card */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
         <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <Building2 size={32} />
            </div>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 break-words">{name}</h1>
                <p className="text-gray-500 mt-1 text-sm md:text-base">{description}</p>
            </div>
         </div>
         <div className="text-left md:text-right w-full md:w-auto bg-gray-50 md:bg-transparent p-4 md:p-0 rounded-xl relative z-10">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Programs</p>
            <p className="text-3xl md:text-4xl font-bold text-emerald-600">{programs.length}</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
         
         {/* LEFT COLUMN */}
         <div className="md:col-span-1 space-y-8">
            
            {/* Admin Profile */}
            <div>
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><User size={18}/> Department Head</h3>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-full mb-4 overflow-hidden border-4 border-white shadow-md shrink-0">
                        {departmentHead?.profilePicture ? (
                            <img src={`http://localhost:5000${departmentHead.profilePicture}`} alt="Admin" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-2xl uppercase">
                                {departmentHead?.name?.charAt(0) || '?'}
                            </div>
                        )}
                    </div>
                    {departmentHead ? (
                        <>
                            <h4 className="text-xl font-bold text-gray-800 break-words">{departmentHead.name}</h4>
                            <p className="text-emerald-600 font-medium text-sm mb-4">{departmentHead.position || 'Department Head'}</p>
                            <div className="w-full bg-gray-50 p-3 rounded-xl text-xs text-gray-500 break-all font-mono">
                                {departmentHead.email}
                            </div>
                        </>
                    ) : (
                        <div className="py-4">
                            <p className="font-bold text-gray-400">Not Assigned</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Staff List with Actions */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><Briefcase size={18}/> Team Members</h3>
                    {canManageStaff && (
                        <button 
                            onClick={() => setIsStaffModalOpen(true)}
                            className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1"
                        >
                            <Plus size={14}/> Add
                        </button>
                    )}
                </div>
                
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {staffList.length > 0 ? (
                        <div className="space-y-3">
                            {staffList.map(staffMember => (
                                <div key={staffMember._id} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-200 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden border border-blue-100">
                                            {staffMember.profilePicture ? <img src={`http://localhost:5000${staffMember.profilePicture}`} className="w-full h-full object-cover"/> : staffMember.name[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-800 text-sm truncate">{staffMember.name}</p>
                                            <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                                               {staffMember.role === 'ADMIN' && <Shield size={10} className="text-emerald-500 fill-emerald-500"/>} 
                                               {staffMember.position || 'Staff'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* --- ACTION BUTTONS (Only for Authorized Managers) --- */}
                                    {canManageStaff && (
                                        <div className="flex gap-2 pt-2 border-t border-gray-200 mt-1">
                                            <button 
                                                onClick={() => handleMigrateStaff(staffMember._id, staffMember.name)}
                                                className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-600 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                                            >
                                                <ArrowRightLeft size={12}/> Migrate
                                            </button>
                                            <button 
                                                onClick={() => handleRemoveStaff(staffMember._id, staffMember.name)}
                                                className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold bg-red-50 text-red-600 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                                            >
                                                <Trash2 size={12}/> Remove
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-40 flex flex-col items-center justify-center text-gray-300 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                            <User size={24} className="mb-2 opacity-30"/>
                            <p className="text-xs font-bold uppercase tracking-wide">No Members Found</p>
                        </div>
                    )}
                </div>
            </div>

         </div>

         {/* RIGHT COLUMN (Programs) */}
         <div className="md:col-span-2">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><LayoutGrid size={18}/> Active Programs</h3>
                {/* ✅ CHECK: Only Show "New Program" if authorized */}
                {canCreateProgram && (
                    <button onClick={() => setIsProgramModalOpen(true)} className="w-full md:w-auto bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">
                        <Plus size={16} /> New Program
                    </button>
                )}
            </div>
            
            {programs.length === 0 ? (
                <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 border-dashed flex flex-col items-center justify-center text-center min-h-[300px]">
                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-orange-400 mb-4 text-2xl">🚀</div>
                    <h4 className="font-bold text-gray-600">No Programs Yet</h4>
                    <p className="text-sm text-gray-400 mt-1">{canCreateProgram ? 'Click "New Program" to add one.' : 'No programs have been added yet.'}</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {programs.map(program => (
                        <div key={program._id} onClick={() => navigate(`/programs/${program._id}`)} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group flex flex-col gap-4 relative overflow-hidden cursor-pointer">
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${program.status === 'Completed' ? 'bg-blue-500' : program.status === 'Approved' ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4 pl-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-gray-200">{program.type}</span>
                                        <h4 className="font-bold text-lg text-gray-800 group-hover:text-emerald-600 transition-colors break-words">{program.name}</h4>
                                    </div>
                                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">{program.description}</p>
                                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-400">
                                        <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg"><Calendar size={12}/> {new Date(program.date).toLocaleDateString()}</span>
                                        <span className="flex items-center gap-1"><User size={12}/> {program.createdBy?.name || 'Unknown'}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${program.status === 'Completed' ? 'bg-blue-50 text-blue-600 border-blue-100' : program.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                        {program.status === 'Completed' ? <CheckCircle size={12} /> : <Clock size={12} />} {program.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
         </div>
      </div>

      {canCreateProgram && (
        <>
            <AddProgramModal isOpen={isProgramModalOpen} onClose={() => setIsProgramModalOpen(false)} departmentId={id} onSuccess={fetchAllData} />
            <EditProgramModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} program={selectedProgram} onSuccess={fetchAllData} />
            <CompleteProgramModal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} program={selectedProgram} onSuccess={fetchAllData} />
        </>
      )}
      {canManageStaff && (
        <AddStaffModal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} preSelectedDept={id} disableAdminRole={!!departmentHead} onSuccess={fetchAllData} />
      )}
    </div>
  );
};

export default DepartmentDetails;