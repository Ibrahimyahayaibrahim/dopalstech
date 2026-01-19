import { useEffect, useState, useMemo } from 'react';
import API from '../services/api';
import { Check, X, Clock, FileText, DollarSign, Calendar, AlertCircle, Users, Edit3, Layers, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ManageParticipantsModal from './ManageParticipantsModal'; 
import EditProgramModal from './EditProgramModal'; 

const ProgramRequests = ({ searchQuery = '' }) => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedProgramForParticipants, setSelectedProgramForParticipants] = useState(null);
  const [editingProgram, setEditingProgram] = useState(null); 
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF';

  const myDeptIds = useMemo(() => {
      if (isSuperAdmin) return []; 
      const depts = user.departments || [];
      if (user.department) depts.push(user.department);
      return depts.map(d => d._id || d);
  }, [user, isSuperAdmin]);

  const fetchPrograms = async () => {
    try {
      const { data } = await API.get('/programs');
      setPrograms(data);
    } catch (err) {
      console.error("Failed to fetch programs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleStatusUpdate = async (e, id, newStatus) => {
    e.stopPropagation();
    const action = newStatus === 'Approved' ? 'approve' : 'reject';
    if (!window.confirm(`Are you sure you want to ${action} this program?`)) return;

    try {
      setPrograms(prev => prev.map(p => p._id === id ? { ...p, status: newStatus } : p));
      await API.put(`/programs/${id}/status`, { status: newStatus });
    } catch (err) {
      alert("Failed to update status.");
      fetchPrograms(); 
    }
  };

  const handleEditClick = (e, program) => {
      e.stopPropagation();
      setEditingProgram(program);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBD';
    const date = new Date(dateString);
    return isNaN(date.getTime()) 
        ? 'Date TBD' 
        : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // --- FILTERING LOGIC ---
  
  // 1. Master List: Filter by search query
  const allPrograms = programs.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.createdBy?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 2. Action Required: Items THIS user needs to approve
  const pendingApprovals = allPrograms.filter(p => {
      if (p.status !== 'Pending') return false;
      if (isSuperAdmin) return true;
      if (isAdmin) {
          const pDeptId = p.department?._id || p.department;
          return myDeptIds.includes(pDeptId); 
      }
      return false;
  });

  // 3. My Pending: Staff tracking their own requests
  const myPending = isStaff ? allPrograms.filter(p => p.status === 'Pending' && p.createdBy?._id === user._id) : [];

  // 4. History / All Programs: Everything else (minus duplicates)
  const historyList = allPrograms.filter(p => {
      const inPendingAction = pendingApprovals.find(x => x._id === p._id);
      const inMyPending = myPending.find(x => x._id === p._id);
      return !inPendingAction && !inMyPending;
  });

  // --- PERMISSION CHECK ---
  const canUserEdit = (program) => {
      if (isSuperAdmin) return true;
      const pDeptId = program.department?._id || program.department;
      if (isAdmin && myDeptIds.includes(pDeptId)) return true;
      if (isStaff && program.createdBy?._id === user._id && myDeptIds.includes(pDeptId)) return true;
      return false;
  };

  // --- HELPER: DETERMINE PROGRAM TYPE (Master vs Version vs Standard) ---
  const getTypeInfo = (p) => {
      // 1. Is it a Master Blueprint? (Recursive/Numerical structure but NO parent)
      if (!p.parentProgram && (p.structure === 'Recurring' || p.structure === 'Numerical')) {
          return { label: 'Master', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Layers };
      }
      // 2. Is it a Version/Batch? (Has a parent)
      if (p.parentProgram) {
          return { label: 'Version', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Hash };
      }
      // 3. Standard One-Time Program
      return null; 
  };

  if (loading) return <div className="p-10 text-center text-gray-400 font-bold animate-pulse">Loading Requests...</div>;

  return (
    <div className="space-y-8 animate-enter pb-10">
      
      {/* SECTION A: ACTION REQUIRED */}
      {pendingApprovals.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="text-amber-500" /> Action Required
            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full">{pendingApprovals.length}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingApprovals.map((program) => (
                <ProgramCard 
                    key={program._id} 
                    program={program} 
                    onClick={() => navigate(`/programs/${program._id}`)}
                    onAction={handleStatusUpdate}
                    onEdit={handleEditClick}
                    formatDate={formatDate}
                    canAct={true} 
                    canEdit={canUserEdit(program)}
                    getTypeInfo={getTypeInfo} 
                />
              ))}
          </div>
        </div>
      )}

      {/* SECTION B: MY PENDING */}
      {isStaff && myPending.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="text-blue-500" /> Awaiting Approval
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">{myPending.length}</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myPending.map((program) => (
                    <ProgramCard 
                        key={program._id} 
                        program={program} 
                        onClick={() => navigate(`/programs/${program._id}`)}
                        onEdit={handleEditClick}
                        formatDate={formatDate}
                        isOwner={true}
                        canEdit={true} 
                        getTypeInfo={getTypeInfo}
                    />
                ))}
            </div>
          </div>
      )}

      {/* SECTION C: GLOBAL HISTORY */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="text-gray-400" /> All Programs
        </h2>
        
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="overflow-x-auto">
               <table className="w-full text-left text-sm min-w-[700px]">
                  <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-xs">
                     <tr>
                        <th className="p-4">Program</th>
                        <th className="p-4">Type</th> {/* New Column */}
                        <th className="p-4">Date</th>
                        <th className="p-4">Department</th>
                        <th className="p-4">Requester</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {historyList.map(p => {
                        const typeInfo = getTypeInfo(p);
                        return (
                            <tr key={p._id} onClick={() => navigate(`/programs/${p._id}`)} className="hover:bg-gray-50/50 cursor-pointer transition-colors group">
                                <td className="p-4 font-bold text-gray-700">{p.name}</td>
                                <td className="p-4">
                                    {typeInfo ? (
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${typeInfo.color}`}>
                                            <typeInfo.icon size={10}/> {typeInfo.label}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-xs font-medium">Standard</span>
                                    )}
                                </td>
                                <td className="p-4 text-gray-500 whitespace-nowrap">
                                    {typeInfo?.label === 'Master' ? '—' : formatDate(p.date)}
                                </td>
                                <td className="p-4 text-gray-500">
                                    <span className="inline-block bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded border border-gray-200">
                                        {p.department?.name || 'General'}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-500">
                                    {p.createdBy?._id === user._id ? <span className="text-emerald-600 font-bold">You</span> : p.createdBy?.name}
                                </td>
                                <td className="p-4"><StatusBadge status={p.status} /></td>
                                
                                <td className="p-4 text-right flex justify-end gap-2">
                                    {canUserEdit(p) && (
                                        <button 
                                            onClick={(e) => handleEditClick(e, p)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit Program"
                                        >
                                            <Edit3 size={16}/>
                                        </button>
                                    )}

                                    {/* Manage Participants Button - Only for Approved/Completed/Active */}
                                    {(p.status === 'Approved' || p.status === 'Completed' || p.status === 'Ongoing') && !typeInfo?.label === 'Master' && (isSuperAdmin || canUserEdit(p)) && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setSelectedProgramForParticipants(p); }}
                                            className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors border border-blue-100 opacity-0 group-hover:opacity-100"
                                        >
                                            <Users size={14}/> Manage
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                     })}
                     {historyList.length === 0 && (
                        <tr><td colSpan="7" className="p-12 text-center text-gray-400"><p>No programs found.</p></td></tr>
                     )}
                  </tbody>
               </table>
           </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      <ManageParticipantsModal 
          isOpen={!!selectedProgramForParticipants} 
          onClose={() => setSelectedProgramForParticipants(null)} 
          program={selectedProgramForParticipants}
          onSuccess={fetchPrograms} 
      />

      <EditProgramModal 
          isOpen={!!editingProgram} 
          onClose={() => setEditingProgram(null)} 
          program={editingProgram}
          onSuccess={fetchPrograms} 
      />

    </div>
  );
};

// --- CARD COMPONENT ---
const ProgramCard = ({ program, onClick, onAction, onEdit, formatDate, canAct, isOwner, canEdit, getTypeInfo }) => {
    const typeInfo = getTypeInfo(program);

    return (
        <div onClick={onClick} className={`bg-white p-5 rounded-2xl shadow-sm border relative overflow-hidden group hover:shadow-md transition-all cursor-pointer ${isOwner ? 'border-blue-100' : 'border-amber-100'}`}>
            {/* Side Color Bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${typeInfo ? (typeInfo.label === 'Master' ? 'bg-purple-500' : 'bg-blue-500') : (isOwner ? 'bg-blue-400' : 'bg-amber-400')}`}></div>
            
            <div className="flex justify-between items-start mb-2 pl-3">
                <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-bold text-base text-gray-800 line-clamp-1">{program.name}</h3>
                    <div className="flex gap-2 mt-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{program.type}</span>
                        {/* Type Badge */}
                        {typeInfo && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border flex items-center gap-1 ${typeInfo.color}`}>
                                {typeInfo.label}
                            </span>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {canEdit && (
                        <button 
                            onClick={(e) => onEdit(e, program)}
                            className="p-1.5 bg-gray-50 text-gray-500 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                        >
                            <Edit3 size={14}/>
                        </button>
                    )}

                    {isOwner ? (
                        <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-[10px] font-bold">Pending</span>
                    ) : (
                        <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1"><Clock size={10} /> Review</span>
                    )}
                </div>
            </div>
            
            <p className="text-gray-500 text-xs mb-4 pl-3 line-clamp-2 min-h-[2.5em]">{program.description || 'No description provided.'}</p>
            
            <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 mb-4 pl-3">
                {/* Don't show Date TBD for Master programs */}
                {typeInfo?.label !== 'Master' && (
                    <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded"><Calendar size={10}/> {formatDate(program.date)}</span>
                )}
                <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded"><DollarSign size={10}/> ₦{program.cost?.toLocaleString()}</span>
            </div>

            {canAct && (
                <div className="flex gap-2 pl-3 mt-auto">
                    <button onClick={(e) => onAction(e, program._id, 'Approved')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1"><Check size={14}/> Approve</button>
                    <button onClick={(e) => onAction(e, program._id, 'Rejected')} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1"><X size={14}/> Reject</button>
                </div>
            )}
        </div>
    );
};

const StatusBadge = ({ status }) => {
   const styles = {
      Approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
      Rejected: "bg-red-100 text-red-600 border-red-100",
      Completed: "bg-blue-100 text-blue-700 border-blue-200",
      Pending: "bg-amber-100 text-amber-700 border-amber-200",
      Ongoing: "bg-purple-100 text-purple-700 border-purple-200",
      Cancelled: "bg-gray-100 text-gray-500 border-gray-200",
   };
   return <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${styles[status] || 'bg-gray-100'}`}>{status}</span>;
};

export default ProgramRequests;