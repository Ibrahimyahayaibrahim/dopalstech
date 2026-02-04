import { useRef } from 'react';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  FileText,
  Heart,
  Linkedin,
  Shield,
  Clock,
  Building2,
  Printer,
  QrCode,
  Briefcase
} from 'lucide-react';
import logo from '../assets/logo.png'; 
import signatureImg from '../assets/signature.png'; // Authorized signature image

const StaffIdCardModal = ({ user, onClose }) => {
  if (!user) return null;

  const idCardRef = useRef(null);

  // --- HELPER: Image URL ---
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    if (path.startsWith('blob:')) return path;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `http://localhost:5000${normalized}`;
  };

  const status = (user.status || 'Active').toLowerCase();
  const isActive = status === 'active';
  const roleLabel = (user.role || 'STAFF').toString().replaceAll('_', ' ').toUpperCase();

  // Handle Departments
  const getDepartmentString = () => {
    if (user.departments && user.departments.length > 0) {
        return user.departments.map(d => d.name).join(', ');
    }
    if (user.department?.name) return user.department.name;
    return 'General Staff';
  };
  const deptDisplay = getDepartmentString();

  // --- PRINT FUNCTION ---
  const handlePrint = () => {
    const content = idCardRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank', 'width=900,height=650');
    if (!printWindow) return;

    const htmlContent = content.innerHTML;

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ID CARD - ${user.name}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page { size: A4 portrait; margin: 0; }
            body { 
                margin: 0; padding: 20px; background: white;
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important; 
                display: flex; flex-direction: column; align-items: center; gap: 20px;
            }
            .id-card-side {
                width: 85.6mm !important; height: 54mm !important;
                border: 1px dashed #ccc; position: relative; overflow: hidden;
                background-color: white !important; display: flex; flex-direction: column;
                page-break-inside: avoid;
            }
            /* Custom Fonts adjustments for print */
            .print-text-shadow { text-shadow: 0 1px 2px rgba(0,0,0,0.1); }
          </style>
        </head>
        <body>
          <div class="print-wrapper">${htmlContent}</div>
        </body>
      </html>
    `);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-gray-900 overflow-y-auto animate-in fade-in duration-200 transition-colors duration-300">
      
      {/* Top Actions */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[110] flex items-center gap-2">
        <button onClick={handlePrint} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 border border-emerald-500 px-6 py-2 text-white hover:bg-emerald-700 shadow-lg active:scale-95 transition">
          <Printer size={18} /> <span className="text-sm font-bold">Print ID Card</span>
        </button>
        <button onClick={onClose} className="inline-flex items-center justify-center rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-slate-200 dark:border-gray-700 p-3 text-slate-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 shadow-sm transition">
          <X size={22} />
        </button>
      </div>

      {/* =========================================================
          SCREEN VIEW: DETAILED PROFILE
          (Includes Joined Date, LinkedIn, Emergency Relationship)
         ========================================================= */}
      <div className="min-h-screen flex flex-col">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 text-white pb-32">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 max-w-5xl mx-auto px-6 pt-12">
            <div className="flex flex-col gap-4">
               <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-bold tracking-wider">{roleLabel}</span>
                  {isActive ? (
                    <span className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-xs font-bold text-emerald-200"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> ACTIVE</span>
                  ) : (
                    <span className="px-3 py-1 bg-red-500/20 border border-red-400/30 rounded-full text-xs font-bold text-red-200">SUSPENDED</span>
                  )}
               </div>
               <h1 className="text-5xl font-extrabold tracking-tight">{user.name}</h1>
               <div className="flex items-center gap-4 text-emerald-100/80 text-sm font-medium">
                  <span className="flex items-center gap-2"><Briefcase size={16}/> {user.position || 'Staff Member'}</span>
                  <span className="flex items-center gap-2"><Building2 size={16}/> {deptDisplay}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Profile Details Body */}
        <div className="flex-1 bg-slate-50 dark:bg-gray-900 transition-colors -mt-20">
          <div className="max-w-5xl mx-auto px-6 pb-20">
             
             {/* Main Card */}
             <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-slate-100 dark:border-gray-700 p-8 flex flex-col md:flex-row gap-8 items-start">
                {/* Photo */}
                <div className="w-40 h-40 rounded-2xl overflow-hidden border-4 border-white dark:border-gray-700 shadow-2xl shrink-0 bg-gray-100">
                    <img src={getImageUrl(user.profilePicture) || "https://via.placeholder.com/150"} className="w-full h-full object-cover" alt="Profile" />
                </div>

                {/* Details Grid */}
                <div className="flex-1 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Personal Info */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2"><User size={14}/> Personal Details</h3>
                            <InfoItem label="Email" value={user.email} />
                            <InfoItem label="Phone" value={user.phone} />
                            <InfoItem label="Date Joined" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'} />
                            <InfoItem label="Address" value={user.address} />
                        </div>

                        {/* Emergency & Socials */}
                        <div className="space-y-6">
                             {/* Emergency Block */}
                             <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/20">
                                <h3 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest flex items-center gap-2 mb-3"><Heart size={14}/> Emergency Contact</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-xs text-red-400 font-bold uppercase">Name</span>
                                        <span className="text-sm font-bold text-red-900 dark:text-red-200">{user.emergencyContact?.name || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-red-400 font-bold uppercase">Relationship</span>
                                        <span className="text-sm font-bold text-red-900 dark:text-red-200">{user.emergencyContact?.relationship || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-red-200 dark:border-red-800 pt-2 mt-2">
                                        <span className="text-xs text-red-400 font-bold uppercase">Phone</span>
                                        <span className="text-sm font-bold text-red-900 dark:text-red-200">{user.emergencyContact?.phone || 'N/A'}</span>
                                    </div>
                                </div>
                             </div>

                             {/* LinkedIn Button */}
                             {user.linkedin && (
                                <a href={user.linkedin} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#0077b5] text-white font-bold hover:bg-[#006097] transition shadow-md hover:shadow-lg">
                                    <Linkedin size={20}/> View LinkedIn Profile
                                </a>
                             )}
                        </div>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          PRINT LAYOUT (HIDDEN) - CR80 PLASTIC CARD
          Updated Style: Modern Curve Design, Original Logo, Full Name
         ========================================================= */}
      <div className="fixed left-[-9999px] top-0" aria-hidden="true">
        <div ref={idCardRef}>
          
          {/* --- FRONT SIDE (Modern Style) --- */}
          <div className="id-card-side flex flex-col relative bg-white overflow-hidden">
             
             {/* DESIGN: Modern Curves Background */}
             <div className="absolute top-0 left-0 w-full h-full z-0">
                {/* Main Green Curve */}
                <div className="absolute top-0 right-0 w-[80%] h-[120%] bg-emerald-900 origin-top-right -rotate-12 rounded-bl-[100px] translate-x-10 -translate-y-4"></div>
                {/* Accent Gold/Yellow Curve for Style */}
                <div className="absolute top-0 right-0 w-[82%] h-[120%] bg-amber-400 origin-top-right -rotate-12 rounded-bl-[100px] translate-x-8 -translate-y-4 -z-10"></div>
                {/* Subtle Texture */}
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gray-100 rounded-tr-full opacity-50"></div>
             </div>

             {/* HEADER: Logo (Original Colors) & Company Name */}
             <div className="relative z-10 flex items-center justify-between px-4 pt-3 pb-1">
                 {/* Logo - No filter, original colors */}
                 <div className="bg-white/90 p-1 rounded-lg shadow-sm">
                    <img src={logo} alt="Logo" className="h-8 w-8 object-contain" /> 
                 </div>
                 <div className="text-right">
                     <h1 className="text-white font-black text-xs tracking-widest uppercase">Dopals Tech</h1>
                     <p className="text-emerald-200 text-[6px] tracking-widest uppercase">Future is Now</p>
                 </div>
             </div>

             {/* CONTENT: Photo & Details */}
             <div className="relative z-10 flex flex-row items-center px-4 mt-1 gap-3 w-full">
                {/* Photo with double border ring */}
                <div className="relative shrink-0">
                    <div className="w-[28mm] h-[28mm] rounded-xl overflow-hidden border-2 border-white shadow-lg bg-gray-200">
                        <img src={getImageUrl(user.profilePicture) || "https://via.placeholder.com/150"} className="w-full h-full object-cover" crossOrigin="anonymous"/>
                    </div>
                    {/* Active Dot */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>

                {/* Text Details */}
                <div className="flex-1 min-w-0 text-white">
                    {/* NAME - No truncation, allow wrap, tight leading */}
                    <h2 className="text-white font-black text-sm uppercase leading-tight mb-1 break-words drop-shadow-md">
                        {user.name}
                    </h2>
                    <div className="inline-block bg-amber-400 text-emerald-900 text-[8px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide mb-2 shadow-sm">
                        {user.position || "Staff"}
                    </div>

                    <div className="space-y-[2px] text-emerald-100/90">
                        <div className="flex text-[7px] items-center">
                            <span className="w-10 font-bold opacity-70">ID NO:</span>
                            <span className="font-mono font-bold text-white">DOP-{user._id ? user._id.slice(-6).toUpperCase() : '000'}</span>
                        </div>
                        <div className="flex text-[7px] items-start">
                            <span className="w-10 font-bold opacity-70 shrink-0">DEPT:</span>
                            <span className="font-bold text-white leading-tight">{deptDisplay}</span>
                        </div>
                        <div className="flex text-[7px] items-center">
                            <span className="w-10 font-bold opacity-70">JOINED:</span>
                            <span className="font-bold text-white">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                    </div>
                </div>
             </div>

             {/* FOOTER STRIP */}
             <div className="mt-auto relative z-10 px-4 pb-2 flex justify-between items-end">
                <div className="text-[6px] text-gray-500 font-bold bg-white/80 px-2 py-0.5 rounded backdrop-blur-sm">
                    EXP: DEC {new Date().getFullYear() + 2}
                </div>
                <QrCode size={24} className="text-emerald-900 bg-white p-0.5 rounded shadow-sm"/>
             </div>
          </div>

          {/* --- BACK SIDE --- */}
          <div className="id-card-side flex flex-col p-4 relative bg-white">
             {/* Header */}
             <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
                <h3 className="text-[9px] font-black text-emerald-900 uppercase tracking-widest">Dopals Technologies</h3>
                <div className="text-[6px] text-gray-400">RC: 12345678</div>
             </div>

             <div className="flex-1 space-y-3">
                 {/* Policies */}
                 <div>
                    <h4 className="text-[7px] font-bold text-gray-500 uppercase mb-0.5">Card Policy</h4>
                    <p className="text-[6px] text-gray-400 leading-tight text-justify">
                        This card remains the property of Dopals Technologies. It is non-transferable and must be presented upon request. If found, please return to the address below.
                    </p>
                 </div>

                 <div className="grid grid-cols-2 gap-2">
                     {/* Home Address */}
                     <div>
                        <h4 className="text-[7px] font-bold text-emerald-700 uppercase mb-0.5">Staff Address</h4>
                        <p className="text-[7px] text-gray-800 font-bold leading-tight">
                            {user.address || 'No address provided'}
                        </p>
                     </div>

                     {/* Emergency Contact (Name + Relation + Phone) */}
                     <div>
                        <h4 className="text-[7px] font-bold text-red-600 uppercase mb-0.5">Emergency ({user.emergencyContact?.relationship || 'N/A'})</h4>
                        <p className="text-[7px] text-gray-800 font-bold leading-tight">
                            {user.emergencyContact?.name || 'N/A'}
                        </p>
                        <p className="text-[7px] text-gray-600 font-mono">
                            {user.emergencyContact?.phone || 'N/A'}
                        </p>
                     </div>
                 </div>
             </div>

             {/* Footer */}
             <div className="mt-auto">
                <div className="flex justify-between items-end mb-2">
                   <div className="text-[6px] text-gray-500">
                      <p><b>HR Dept:</b> hr@dopalstech.com</p>
                      <p><b>Emergency:</b> +234 800 123 4567</p>
                   </div>
                   {/* ✅ FIXED SIGNATURE AREA */}
<div className="flex flex-col items-center gap-0.5">
    {/* Container: Wider (w-32) and Taller (h-12) */}
    <div className="w-32 border-b border-gray-400 pb-0.5 mb-0.5 flex justify-center items-end h-12"> 
        <img 
           src={signatureImg} 
           alt="Signature" 
           // CSS Filters: mix-blend-multiply removes white background, contrast makes it darker
           className="h-full w-auto object-contain object-bottom mix-blend-multiply contrast-125" 
        />
    </div>
    <p className="text-[5px] text-gray-500 uppercase tracking-widest font-bold">Authorized Signature</p>
</div>
                </div>
                <div className="bg-emerald-900 text-white text-center py-1 rounded-sm">
                   <p className="text-[6px] font-bold tracking-[0.2em]">WWW.DOPALSTECH.COM</p>
                </div>
             </div>
          </div>

        </div>
      </div>

    </div>
  );
};

// UI Helper
const InfoItem = ({ label, value }) => (
    <div className="flex flex-col">
        <span className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-bold text-slate-900 dark:text-white break-words">{value || 'N/A'}</span>
    </div>
);

export default StaffIdCardModal;