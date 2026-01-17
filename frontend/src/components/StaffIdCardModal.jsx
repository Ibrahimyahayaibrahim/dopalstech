import { X, Phone, Mail, MapPin, Calendar, User, FileText, Heart, Linkedin, Shield, Clock } from 'lucide-react';

const StaffIdCardModal = ({ user, onClose }) => {
  if (!user) return null;

  // --- FIX: Helper to handle image paths correctly ---
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path; // External link (Google/Cloudinary)
    if (path.startsWith('blob:')) return path; // Local preview blob
    return `http://localhost:5000${path}`; // Local server path
  };

  return (
    // 1. FULL SCREEN WRAPPER
    <div className="fixed inset-0 z-[9999] bg-white overflow-y-auto animate-enter">
      
      <button 
          onClick={onClose} 
          className="fixed top-6 right-6 bg-black/10 hover:bg-black/20 text-gray-800 p-3 rounded-full transition-colors z-[110] backdrop-blur-md"
      >
          <X size={24}/>
      </button>

      {/* 2. MAIN CONTENT */}
      <div className="w-full min-h-screen flex flex-col">
        
        {/* --- HEADER SECTION --- */}
        <div className="relative bg-gradient-to-r from-emerald-900 to-emerald-700 text-white pb-24 pt-16 px-6 md:px-8 shadow-lg">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
                
                {/* Name & Role */}
                <div className="flex-1 min-w-0"> 
                    <div className="flex items-center gap-3 mb-2">
                        <span className="bg-emerald-400/20 text-emerald-100 text-[10px] md:text-xs px-3 py-1 rounded-full uppercase font-bold border border-emerald-400/30">
                            {user.role}
                        </span>
                        {user.status === 'Active' ? (
                            <span className="flex items-center gap-1 text-[10px] md:text-xs font-bold text-green-300 bg-green-900/30 px-3 py-1 rounded-full border border-green-400/20">
                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div> Active
                            </span>
                        ) : (
                            <span className="text-[10px] md:text-xs font-bold text-red-300 bg-red-900/30 px-3 py-1 rounded-full border border-red-400/20">
                                Suspended
                            </span>
                        )}
                    </div>
                    
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-2 leading-tight break-words">
                        {user.name}
                    </h1>
                    
                    <p className="text-lg text-emerald-100 font-medium opacity-90">{user.position || 'Staff Member'}</p>
                </div>

                {/* Department Info */}
                <div className="text-left md:text-right opacity-80 bg-white/5 p-4 rounded-xl border border-white/10 shrink-0">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-300 mb-1">Department</p>
                    <p className="font-bold text-xl">{user.department?.name || 'Unassigned'}</p>
                </div>
            </div>

            {/* Decorative Background Pattern */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-12 blur-3xl pointer-events-none"></div>
        </div>

        {/* --- BODY SECTION --- */}
        <div className="flex-1 bg-gray-50">
            {/* Negative margin pulls content up over the header */}
            <div className="max-w-5xl mx-auto px-6 md:px-8 -mt-16 mb-20">
                
                {/* Profile Picture Card */}
                <div className="bg-white p-1.5 rounded-[2rem] shadow-xl inline-block mb-8">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-[1.7rem] bg-emerald-100 flex items-center justify-center text-5xl font-bold text-emerald-700 overflow-hidden relative border border-gray-100">
                        {user.profilePicture ? (
                            <img src={getImageUrl(user.profilePicture)} className="w-full h-full object-cover" alt="Profile" />
                        ) : (
                            user.name.charAt(0)
                        )}
                    </div>
                </div>

                {/* INFO GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* LEFT COLUMN (Main Details) */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* 1. Contact Info */}
                        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="text-base font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <User size={18} className="text-emerald-600"/> Personal Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <InfoItem label="Email Address" value={user.email} icon={<Mail size={16}/>} />
                                <InfoItem label="Phone Number" value={user.phone} icon={<Phone size={16}/>} />
                                <InfoItem label="Date of Birth" value={user.dob ? new Date(user.dob).toLocaleDateString() : 'N/A'} icon={<Calendar size={16}/>} />
                                <InfoItem label="Gender" value={user.gender} icon={<User size={16}/>} />
                            </div>
                        </div>

                        {/* 2. Security & Address */}
                        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                             <h3 className="text-base font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <Shield size={18} className="text-blue-600"/> Security & Location
                             </h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <InfoItem label="NIN (National ID)" value={user.nin} icon={<FileText size={16}/>} />
                                <InfoItem label="Home Address" value={user.address} icon={<MapPin size={16}/>} />
                             </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN (Sidebar Info) */}
                    <div className="space-y-6">
                        
                        {/* Emergency Contact */}
                        <div className="bg-red-50 p-6 md:p-8 rounded-3xl border border-red-100">
                            <h3 className="text-base font-bold text-red-900 mb-6 flex items-center gap-2">
                                <Heart size={18} className="text-red-600"/> Emergency
                            </h3>
                            <div className="space-y-5">
                                <InfoItem label="Name" value={user.emergencyContact?.name} />
                                <InfoItem label="Relationship" value={user.emergencyContact?.relationship} />
                                <div className="pt-3 border-t border-red-200">
                                    <p className="text-[10px] font-bold text-red-400 uppercase mb-1">Emergency Phone</p>
                                    <p className="text-lg font-bold text-red-700">{user.emergencyContact?.phone || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Bio / Social */}
                        {(user.bio || user.linkedin) && (
                            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                                {user.linkedin && (
                                    <a href={user.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-blue-600 hover:underline font-bold mb-6 text-sm">
                                        <div className="p-2 bg-blue-50 rounded-full"><Linkedin size={18}/></div>
                                        View LinkedIn Profile
                                    </a>
                                )}
                                {user.bio && (
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">About</p>
                                        <p className="text-sm text-gray-600 italic leading-relaxed">"{user.bio}"</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Meta Data */}
                        <div className="text-center opacity-40">
                            <p className="text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                                <Clock size={10}/> Joined {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

// Component for consistent rows (Slightly smaller text)
const InfoItem = ({ label, value, icon }) => (
    <div>
        <div className="flex items-center gap-2 mb-1">
            {icon && <span className="text-gray-400">{icon}</span>}
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</span>
        </div>
        <p className="font-semibold text-gray-800 text-sm md:text-base break-words leading-tight">
            {value || <span className="text-gray-300 italic">Not Provided</span>}
        </p>
    </div>
);

export default StaffIdCardModal;