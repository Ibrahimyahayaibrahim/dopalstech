import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { 
  X, UserPlus, Users, Mail, Search, CheckCircle, 
  Loader2, CheckSquare, Square, Building2, ChevronDown, Check 
} from 'lucide-react';

const AddStaffModal = ({ isOpen, onClose, preSelectedDept, onSuccess, disableAdminRole }) => {
  const [activeTab, setActiveTab] = useState(preSelectedDept ? 'existing' : 'new'); 
  const [loading, setLoading] = useState(false);
  
  // --- STATE FOR EXISTING STAFF ---
  const [allAvailableUsers, setAllAvailableUsers] = useState([]); 
  const [filteredUsers, setFilteredUsers] = useState([]); 
  const [selectedUserIds, setSelectedUserIds] = useState([]); 
  const [searchTerm, setSearchTerm] = useState(''); 

  // --- STATE FOR NEW INVITE ---
  const [departments, setDepartments] = useState([]); 
  const [occupiedAdminDeptIds, setOccupiedAdminDeptIds] = useState(new Set()); // Track depts with existing admins
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false); // Toggle for custom dropdown
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    role: 'STAFF',
    departments: preSelectedDept ? [preSelectedDept] : []
  });

  // 1. Fetch Data
  useEffect(() => {
    if (isOpen) {
        const fetchData = async () => {
            try {
                const [usersRes, deptRes] = await Promise.all([
                    API.get('/users'),
                    API.get('/departments')
                ]);
                
                // Identify departments that already have an ADMIN
                const occupied = new Set();
                usersRes.data.forEach(u => {
                    if (u.role === 'ADMIN' && u.departments) {
                        u.departments.forEach(d => occupied.add((d._id || d).toString()));
                    }
                });
                setOccupiedAdminDeptIds(occupied);

                // Filter Logic for Existing Users Tab
                const cleanList = usersRes.data.filter(u => 
                    u.role !== 'SUPER_ADMIN' && 
                    (!preSelectedDept || !u.departments.some(d => (d._id || d) === preSelectedDept))
                );

                setAllAvailableUsers(cleanList);
                setFilteredUsers(cleanList);
                setSelectedUserIds([]); 
                setSearchTerm('');
                setDepartments(deptRes.data);

            } catch (err) {
                console.error("Failed to load modal data", err);
            }
        };
        fetchData();
    }
  }, [isOpen, preSelectedDept]);

  // 2. Handle Search
  useEffect(() => {
    if (searchTerm.trim() === '') {
        setFilteredUsers(allAvailableUsers);
    } else {
        const lowerTerm = searchTerm.toLowerCase();
        const results = allAvailableUsers.filter(u => 
            u.name.toLowerCase().includes(lowerTerm) || 
            u.email.toLowerCase().includes(lowerTerm)
        );
        setFilteredUsers(results);
    }
  }, [searchTerm, allAvailableUsers]);

  // Close dropdown on click outside
  useEffect(() => {
      const handleClickOutside = (event) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
              setIsDeptDropdownOpen(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  // --- LOGIC: Handle Actions ---

  const toggleUserSelection = (userId) => {
      setSelectedUserIds(prev => 
          prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId] 
      );
  };

  // ✅ Handle Multi-Select Department Toggle
  const toggleDepartmentSelection = (deptId) => {
      setFormData(prev => {
          const current = prev.departments;
          if (current.includes(deptId)) {
              return { ...prev, departments: current.filter(id => id !== deptId) };
          } else {
              return { ...prev, departments: [...current, deptId] };
          }
      });
  };

  // ✅ Handle Role Change (Reset depts if switching to Admin to force re-validation)
  const handleRoleChange = (newRole) => {
      setFormData(prev => ({
          ...prev,
          role: newRole,
          departments: [] // Clear selection to prevent invalid state
      }));
  };

  // ✅ Filter Available Departments based on Role
  const availableDepartments = departments.filter(dept => {
      // If role is ADMIN, hide departments that already have one
      if (formData.role === 'ADMIN') {
          return !occupiedAdminDeptIds.has(dept._id);
      }
      return true; // If STAFF, show all
  });

  const handleAddExisting = async () => {
      if (selectedUserIds.length === 0) return alert("Please select at least one user");
      try {
          setLoading(true);
          await API.post('/users/add-to-dept', { 
              userIds: selectedUserIds, 
              departmentId: preSelectedDept 
          });
          alert(`${selectedUserIds.length} users added successfully!`);
          onSuccess();
          onClose();
      } catch (err) {
          alert(err.response?.data?.message || "Failed to add users");
      } finally {
          setLoading(false);
      }
  };

  const handleInviteNew = async (e) => {
    e.preventDefault();
    if (formData.departments.length === 0) {
        return alert("Please select at least one department.");
    }
    setLoading(true);
    try {
      await API.post('/users/invite', formData);
      alert('Invitation Sent Successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to invite user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <UserPlus size={20} className="text-emerald-600"/> 
                {preSelectedDept ? "Add Team Member" : "Create New Staff"}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X size={18} className="text-gray-500"/>
            </button>
        </div>

        {/* Tabs - Only if in Department Context */}
        {preSelectedDept && (
            <div className="flex p-2 gap-2 bg-white border-b border-gray-100 shrink-0">
                <button 
                    onClick={() => setActiveTab('existing')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all
                    ${activeTab === 'existing' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <Users size={16}/> Select Existing Staff
                </button>
                <button 
                    onClick={() => setActiveTab('new')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all
                    ${activeTab === 'new' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <Mail size={16}/> Invite New Person
                </button>
            </div>
        )}

        {/* --- CONTENT: EXISTING USER --- */}
        {activeTab === 'existing' && preSelectedDept && (
            <div className="p-6 flex-1 overflow-y-auto flex flex-col">
                <div className="relative mb-4 shrink-0">
                    <Search size={18} className="absolute left-3 top-3 text-gray-400"/>
                    <input 
                        type="text"
                        placeholder="Search by name or email..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar border border-gray-100 rounded-xl mb-4 bg-gray-50/30">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map(u => {
                            const isSelected = selectedUserIds.includes(u._id);
                            return (
                                <div 
                                    key={u._id} 
                                    onClick={() => toggleUserSelection(u._id)}
                                    className={`flex items-center justify-between p-3 border-b border-gray-100 last:border-0 cursor-pointer transition-colors
                                    ${isSelected ? 'bg-emerald-50' : 'hover:bg-white'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isSelected ? 'bg-emerald-200 text-emerald-800' : 'bg-white border border-gray-200 text-gray-500'}`}>
                                            {u.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${isSelected ? 'text-emerald-900' : 'text-gray-700'}`}>{u.name}</p>
                                            <p className="text-xs text-gray-400">{u.email}</p>
                                        </div>
                                    </div>
                                    <div className={isSelected ? "text-emerald-600" : "text-gray-300"}>
                                        {isSelected ? <CheckSquare size={20} className="fill-emerald-100"/> : <Square size={20}/>}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center">
                            <Search size={24} className="mb-2 opacity-20"/>
                            {searchTerm ? 'No matches found.' : 'No available staff found to add.'}
                        </div>
                    )}
                </div>

                <button 
                    onClick={handleAddExisting}
                    disabled={loading || selectedUserIds.length === 0}
                    className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-emerald-200"
                >
                    {loading ? <Loader2 className="animate-spin"/> : <CheckCircle size={18}/>}
                    Add {selectedUserIds.length > 0 ? `${selectedUserIds.length} Members` : 'Selected'}
                </button>
            </div>
        )}

        {/* --- CONTENT: NEW USER FORM --- */}
        {activeTab === 'new' && (
            <form onSubmit={handleInviteNew} className="p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Full Name</label>
                        <input required className="w-full p-3 border border-gray-200 rounded-xl focus:border-blue-500 outline-none" placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Email</label>
                        <input type="email" required className="w-full p-3 border border-gray-200 rounded-xl focus:border-blue-500 outline-none" placeholder="john@company.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Job Position</label>
                    <input required className="w-full p-3 border border-gray-200 rounded-xl focus:border-blue-500 outline-none" placeholder="e.g. Senior Project Officer" value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {!disableAdminRole && (
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">System Role</label>
                            <select 
                                className="w-full p-3 border border-gray-200 rounded-xl focus:border-blue-500 outline-none bg-white"
                                value={formData.role}
                                onChange={(e) => handleRoleChange(e.target.value)}
                            >
                                <option value="STAFF">Staff</option>
                                <option value="ADMIN">Department Admin</option>
                            </select>
                        </div>
                    )}

                    {/* ✅ CUSTOM MULTI-SELECT DROPDOWN */}
                    {!preSelectedDept && (
                        <div className={disableAdminRole ? "col-span-2" : ""} ref={dropdownRef}>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block flex items-center gap-1">
                                <Building2 size={12}/> Assign Departments
                            </label>
                            
                            <div 
                                className="relative w-full p-3 border border-gray-200 rounded-xl bg-white cursor-pointer flex justify-between items-center"
                                onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
                            >
                                <span className={formData.departments.length ? "text-gray-800 font-bold text-sm" : "text-gray-400 text-sm"}>
                                    {formData.departments.length > 0 ? `${formData.departments.length} Selected` : "Select Departments"}
                                </span>
                                <ChevronDown size={16} className="text-gray-400"/>

                                {/* DROPDOWN LIST */}
                                {isDeptDropdownOpen && (
                                    <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 p-2">
                                        {availableDepartments.length > 0 ? (
                                            availableDepartments.map(dept => {
                                                const isSelected = formData.departments.includes(dept._id);
                                                return (
                                                    <div 
                                                        key={dept._id} 
                                                        onClick={(e) => { e.stopPropagation(); toggleDepartmentSelection(dept._id); }}
                                                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors mb-1 ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-600'}`}
                                                    >
                                                        <span className="text-sm font-medium">{dept.name}</span>
                                                        {isSelected && <Check size={14}/>}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="p-3 text-center text-xs text-gray-400">
                                                {formData.role === 'ADMIN' ? 'All eligible departments have admins.' : 'No departments found.'}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ✅ SELECTED DEPARTMENT TAGS */}
                {!preSelectedDept && formData.departments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                        {formData.departments.map(deptId => {
                            const deptName = departments.find(d => d._id === deptId)?.name;
                            return (
                                <span key={deptId} className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                                    {deptName}
                                    <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => toggleDepartmentSelection(deptId)} />
                                </span>
                            );
                        })}
                    </div>
                )}

                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4 shadow-lg shadow-blue-200">
                    {loading ? <Loader2 className="animate-spin"/> : <Mail size={18}/>}
                    Send Invitation
                </button>
            </form>
        )}

      </div>
    </div>
  );
};

export default AddStaffModal;