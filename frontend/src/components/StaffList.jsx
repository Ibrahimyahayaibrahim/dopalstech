import { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { 
  Trash2, Ban, CheckCircle, Search, Mail, Filter, Loader2, 
  ChevronLeft, ChevronRight, Clock, ShieldAlert, MoreVertical, UserX, UserCheck
} from 'lucide-react';
import StaffIdCardModal from './StaffIdCardModal';

const StaffList = ({ searchQuery, currentUser }) => {
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Mobile Menu State
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  // Filters
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departments, setDepartments] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
        try {
            const { data } = await API.get('/users');
            const staffArray = Array.isArray(data) ? data : data.users || [];
            setStaff(staffArray);
            
            const allDeptNames = staffArray.flatMap(u => u.departments?.map(d => d.name) || []);
            const uniqueDepts = ['All', ...new Set(allDeptNames.filter(Boolean))];
            setDepartments(uniqueDepts);
        } catch (err) {
            console.error("Failed to fetch staff:", err);
            setError("Failed to load staff list.");
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  // --- 2. CLOSE MENU ON CLICK OUTSIDE ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- 3. FILTER LOGIC ---
  useEffect(() => {
      if (!staff) return;
      let result = staff;
      
      if (searchQuery) {
          result = result.filter(u => 
              (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
              (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
          );
      }
      if (deptFilter !== 'All') {
          result = result.filter(u => u.departments?.some(d => d.name === deptFilter));
      }
      if (statusFilter !== 'All') {
          result = result.filter(u => u.status === statusFilter);
      }
      setFilteredStaff(result);
      setCurrentPage(1); 
  }, [staff, searchQuery, deptFilter, statusFilter]);

  // --- 4. PAGINATION ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStaff.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  // --- 5. ACTIONS ---
  const canManageUser = (targetUser) => {
      if (!currentUser || !targetUser) return false;
      if (currentUser.role === 'STAFF') return false;
      if (currentUser.role === 'SUPER_ADMIN') return true; 
      if (currentUser.role === 'ADMIN') {
          if (targetUser.role !== 'STAFF') return false;
          const myDepts = currentUser.departments?.map(d => (d._id || d).toString()) || [];
          const targetDepts = targetUser.departments?.map(d => (d._id || d).toString()) || [];
          return myDepts.some(id => targetDepts.includes(id));
      }
      return false;
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    setActiveMenuId(null);
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await API.delete(`/users/${id}`);
        setStaff(prev => prev.filter(u => u._id !== id));
      } catch (err) { alert(err.response?.data?.message || 'Failed to delete user'); }
    }
  };

  const handleToggleStatus = async (id, e) => {
    e.stopPropagation();
    setActiveMenuId(null);
    try {
        const { data } = await API.put(`/users/${id}/status`);
        setStaff(prev => prev.map(u => u._id === id ? { ...u, status: data.status } : u));
    } catch (err) { 
        alert(err.response?.data?.message || 'Failed to update status'); 
    }
  };

  const toggleMenu = (id, e) => {
      e.stopPropagation();
      setActiveMenuId(activeMenuId === id ? null : id);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-emerald-600"/></div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <>
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-auto min-h-[500px]">
        
        {/* --- FILTER HEADER --- */}
        <div className="p-5 border-b border-gray-100 flex flex-wrap gap-4 justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-20">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-2">
                {filteredStaff.length} Members
            </span>
            
            <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:flex-none">
                    <Filter size={14} className="absolute left-3 top-3 text-gray-400 pointer-events-none"/>
                    <select 
                        value={deptFilter} 
                        onChange={(e) => setDeptFilter(e.target.value)}
                        className="w-full md:w-auto pl-9 pr-8 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 cursor-pointer transition-all appearance-none"
                    >
                        {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                    </select>
                </div>

                <div className="relative flex-1 md:flex-none">
                    <ShieldAlert size={14} className="absolute left-3 top-3 text-gray-400 pointer-events-none"/>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full md:w-auto pl-9 pr-8 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 cursor-pointer transition-all appearance-none"
                    >
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Suspended">Suspended</option>
                    </select>
                </div>
            </div>
        </div>

        {/* --- TABLE CONTENT --- */}
        <div className="w-full overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px] tracking-widest sticky top-0">
                    <tr>
                        <th className="p-6">Employee</th>
                        <th className="p-6">Role & Dept</th>
                        <th className="p-6">Status</th>
                        <th className="p-6 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {currentItems.length > 0 ? (
                    currentItems.map((user) => (
                        <tr key={user._id} onClick={() => setSelectedUser(user)} className="hover:bg-emerald-50/40 transition-colors cursor-pointer group relative">
                        
                        {/* 1. EMPLOYEE INFO */}
                        <td className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-extrabold text-lg overflow-hidden border-2 border-white shadow-sm shrink-0">
                                        {user.profilePicture ? (
                                            <img src={`http://localhost:5000${user.profilePicture}`} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            (user.name || '?').charAt(0)
                                        )}
                                    </div>
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white rounded-full ${user.status === 'Active' ? 'bg-green-500' : user.status === 'Pending' ? 'bg-amber-400' : 'bg-red-500'}`}></div>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">{user.name || 'Unknown'}</p>
                                    <p className="text-[11px] text-gray-400 font-medium tracking-wide truncate max-w-[180px]">{user.email}</p>
                                </div>
                            </div>
                        </td>

                        {/* 2. ROLE & DEPT */}
                        <td className="p-6">
                            <p className="font-bold text-xs text-gray-700 mb-1.5">{user.position || 'Staff Member'}</p>
                            <div className="flex flex-wrap gap-1.5">
                                <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase font-bold border border-slate-200 tracking-wider">
                                    {user.role}
                                </span>
                                {(user.departments || []).map((d, idx) => (
                                    <span key={idx} className="text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md font-bold tracking-wide">
                                        {d?.name}
                                    </span>
                                ))}
                            </div>
                        </td>

                        {/* 3. STATUS BADGE */}
                        <td className="p-6">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider
                                ${user.status === 'Active' ? 'bg-green-50 text-green-600 border-green-200' : 
                                  user.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                  'bg-red-50 text-red-600 border-red-200'}`}>
                                {user.status === 'Pending' && <Clock size={10} strokeWidth={3} />}
                                {user.status === 'Suspended' && <Ban size={10} strokeWidth={3} />}
                                {user.status === 'Active' && <CheckCircle size={10} strokeWidth={3} />}
                                {user.status || 'Unknown'}
                            </span>
                        </td>
                        
                        {/* 4. ACTIONS (Responsive Split) */}
                        <td className="p-6 text-right relative">
                            {canManageUser(user) && (
                                <>
                                    {/* DESKTOP: Direct Buttons (Hidden on mobile) */}
                                    <div className="hidden md:flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                                        <button
                                            onClick={(e) => handleToggleStatus(user._id, e)}
                                            className={`p-2 rounded-xl transition-all shadow-sm border ${
                                                user.status === 'Active' 
                                                ? 'bg-white border-gray-200 text-gray-400 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200' 
                                                : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100 hover:shadow-md'
                                            }`}
                                            title={user.status === 'Active' ? "Suspend Account" : "Activate Account"}
                                        >
                                            {user.status === 'Active' ? <UserX size={16} /> : <UserCheck size={16} />}
                                        </button>

                                        {currentUser?.role === 'SUPER_ADMIN' && (
                                            <button
                                                onClick={(e) => handleDelete(user._id, e)}
                                                className="p-2 bg-white border border-gray-200 text-gray-400 rounded-xl hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all shadow-sm hover:shadow-md"
                                                title="Delete User"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>

                                    {/* MOBILE: Three Dots Menu (Hidden on desktop) */}
                                    <div className="md:hidden flex justify-end">
                                        <button 
                                            onClick={(e) => toggleMenu(user._id, e)}
                                            className={`p-2 rounded-lg transition-colors ${activeMenuId === user._id ? 'bg-emerald-100 text-emerald-700' : 'text-gray-400 hover:bg-gray-100'}`}
                                        >
                                            <MoreVertical size={20} />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {activeMenuId === user._id && (
                                            <div 
                                                ref={menuRef}
                                                className="absolute right-8 top-12 z-50 bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-gray-100 p-2 flex flex-col gap-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-200 origin-top-right"
                                                onClick={(e) => e.stopPropagation()} 
                                            >
                                                <div className="px-3 py-2 border-b border-gray-100 mb-1">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Manage Access</p>
                                                </div>
                                                
                                                <button 
                                                    onClick={(e) => handleToggleStatus(user._id, e)}
                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                                                        user.status === 'Active' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                                                    }`}
                                                >
                                                    {user.status === 'Active' ? <UserX size={14}/> : <UserCheck size={14}/>}
                                                    {user.status === 'Active' ? 'Suspend User' : 'Activate User'}
                                                </button>

                                                {currentUser?.role === 'SUPER_ADMIN' && (
                                                    <button 
                                                        onClick={(e) => handleDelete(user._id, e)}
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        <Trash2 size={14}/> Delete Account
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </td>
                        </tr>
                    ))
                    ) : (
                    <tr>
                        <td colSpan={4} className="p-20 text-center text-gray-400">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                    <Search size={24} className="opacity-20" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-600">No staff members found.</p>
                                    <p className="text-xs mt-1">Try adjusting your search or filters.</p>
                                </div>
                            </div>
                        </td>
                    </tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* --- PAGINATION FOOTER --- */}
        {filteredStaff.length > itemsPerPage && (
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="flex items-center gap-1 px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-xl text-gray-600 hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-50 shadow-sm transition-all active:scale-95 disabled:active:scale-100">
                    <ChevronLeft size={16}/> Prev
                </button>
                <span className="text-xs font-bold text-gray-400 bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm">Page {currentPage} of {totalPages}</span>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="flex items-center gap-1 px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-xl text-gray-600 hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-50 shadow-sm transition-all active:scale-95 disabled:active:scale-100">
                    Next <ChevronRight size={16}/>
                </button>
            </div>
        )}
      </div>

      {selectedUser && (
        <StaffIdCardModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </>
  );
};

export default StaffList;