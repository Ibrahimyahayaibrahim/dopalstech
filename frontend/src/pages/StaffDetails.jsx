import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api'; 
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar, User, FileText, 
  Heart, Linkedin, Shield, Clock, Building2, Printer, QrCode, Briefcase, Loader2, CheckCircle2
} from 'lucide-react';
import logo from '../assets/logo.png'; 

// ✅ CORRECT PATH: Using the file you provided
import signatureImg from '../assets/signatures/ceo.png'; 

const StaffDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const idCardRef = useRef(null);

  // --- FETCH USER DATA ---
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const { data } = await API.get(`/users/${id}`);
        setUser(data);
      } catch (err) {
        console.error("Failed to fetch staff", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, [id]);

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    if (path.startsWith('blob:')) return path;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `http://localhost:5000${normalized}`;
  };

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
          <title>ID CARD - ${user?.name}</title>
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
                border: 1px dashed #e5e7eb; position: relative; overflow: hidden;
                background-color: white !important; display: flex; flex-direction: column;
                page-break-inside: avoid;
                border-radius: 8px;
            }
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

  if (loading) return <div className="h-screen flex items-center justify-center text-emerald-600"><Loader2 className="animate-spin" size={48}/></div>;
  if (!user) return <div className="h-screen flex flex-col items-center justify-center">User not found <button onClick={() => navigate(-1)} className="text-blue-500 underline mt-4">Go Back</button></div>;

  const isActive = (user.status || 'active').toLowerCase() === 'active';
  const roleLabel = (user.role || 'STAFF').toString().replaceAll('_', ' ').toUpperCase();
  const deptDisplay = user.departments?.length ? user.departments.map(d => d.name).join(', ') : (user.department?.name || 'General');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 transition-colors duration-300">
      
      {/* --- TOP NAV BAR --- */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 dark:text-gray-300 hover:text-emerald-600 font-bold transition">
            <ArrowLeft size={20} /> Back to List
        </button>
        <button onClick={handlePrint} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-full font-bold shadow-lg hover:bg-emerald-700 active:scale-95 transition">
            <Printer size={18} /> Print ID Card
        </button>
      </div>

      {/* --- HERO HEADER --- */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 text-white pb-32">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 max-w-6xl mx-auto px-6 pt-12">
            <div className="flex flex-col gap-4">
               <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-bold tracking-wider">{roleLabel}</span>
                  {isActive ? (
                    <span className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-xs font-bold text-emerald-200"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> ACTIVE</span>
                  ) : (
                    <span className="px-3 py-1 bg-red-500/20 border border-red-400/30 rounded-full text-xs font-bold text-red-200">SUSPENDED</span>
                  )}
               </div>
               <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">{user.name}</h1>
               <div className="flex flex-wrap items-center gap-6 text-emerald-100/80 text-sm font-medium">
                  <span className="flex items-center gap-2"><Briefcase size={18}/> {user.position || 'Staff Member'}</span>
                  <span className="flex items-center gap-2"><Building2 size={18}/> {deptDisplay}</span>
                  <span className="flex items-center gap-2"><Clock size={18}/> Joined {new Date(user.createdAt).toLocaleDateString()}</span>
               </div>
            </div>
          </div>
      </div>

      {/* --- DETAILS BODY --- */}
      <div className="max-w-6xl mx-auto px-6 pb-20 -mt-24 relative z-20">
         <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-slate-100 dark:border-gray-700 p-8 flex flex-col lg:flex-row gap-10 items-start">
            <div className="w-full lg:w-1/3 flex flex-col gap-6">
                <div className="aspect-square w-full rounded-3xl overflow-hidden border-4 border-white dark:border-gray-700 shadow-2xl bg-gray-100">
                    <img src={getImageUrl(user.profilePicture) || "https://via.placeholder.com/400"} className="w-full h-full object-cover" alt="Profile" />
                </div>
                <div className="bg-slate-50 dark:bg-gray-700/30 p-5 rounded-2xl border border-slate-100 dark:border-gray-700 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm"><Mail size={18} className="text-emerald-600"/></div>
                        <div className="overflow-hidden"><p className="text-xs text-gray-400 font-bold uppercase">Email</p><p className="font-bold truncate dark:text-white">{user.email}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm"><Phone size={18} className="text-emerald-600"/></div>
                        <div><p className="text-xs text-gray-400 font-bold uppercase">Phone</p><p className="font-bold dark:text-white">{user.phone}</p></div>
                    </div>
                </div>
            </div>

            <div className="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700"><User size={16}/> Personal Details</h3>
                    <InfoItem label="Date of Birth" value={user.dob ? new Date(user.dob).toLocaleDateString() : 'N/A'} />
                    <InfoItem label="Gender" value={user.gender} />
                    <InfoItem label="Address" value={user.address} />
                    <InfoItem label="NIN / ID" value={user.nin} />
                </div>
                <div className="space-y-6">
                     <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-2xl border border-red-100 dark:border-red-900/20">
                        <h3 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest flex items-center gap-2 mb-4"><Heart size={14}/> Emergency Contact</h3>
                        <div className="space-y-3">
                            <InfoItem label="Name" value={user.emergencyContact?.name || 'N/A'} />
                            <InfoItem label="Relationship" value={user.emergencyContact?.relationship || 'N/A'} />
                            <div className="pt-2 border-t border-red-200 dark:border-red-800">
                                <InfoItem label="Phone" value={user.emergencyContact?.phone || 'N/A'} />
                            </div>
                        </div>
                     </div>
                     {user.linkedin && (
                        <a href={user.linkedin} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-[#0077b5] text-white font-bold hover:bg-[#006097] transition shadow-md hover:shadow-lg">
                            <Linkedin size={20}/> View LinkedIn Profile
                        </a>
                     )}
                </div>
                {(user.bio) && (
                    <div className="md:col-span-2 mt-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">About Staff</h3>
                        <p className="text-gray-600 dark:text-gray-300 italic leading-relaxed">"{user.bio}"</p>
                    </div>
                )}
            </div>
         </div>
      </div>

      {/* ================================================================
          PRINT ID CARD (PREMIUM DESIGN)
         ================================================================ */}
      <div className="fixed left-[-9999px] top-0" aria-hidden="true">
        <div ref={idCardRef}>
          
          {/* --- FRONT SIDE --- */}
          <div className="id-card-side flex flex-col relative bg-white overflow-hidden mb-8">
             
             {/* DESIGN: Background */}
             <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden">
                <div className="absolute w-full h-full bg-slate-50"></div>
                <div className="absolute top-0 left-0 w-[140%] h-[55%] bg-emerald-900 origin-bottom-left rotate-[-8deg] translate-y-[-20%]"></div>
                <div className="absolute top-[35%] left-[-10%] w-[140%] h-[3mm] bg-amber-400 rotate-[-8deg] shadow-md z-10"></div>
                <img src={logo} className="absolute bottom-[-10%] right-[-10%] w-48 h-48 opacity-[0.05] grayscale brightness-0 invert-0 rotate-[-15deg]" alt="" />
             </div>

             {/* HEADER CAPSULE */}
             <div className="relative z-20 flex justify-between items-start p-4 w-full">
                 <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm pr-4 pl-1 py-1 rounded-full shadow-md border border-white/20">
                     <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm overflow-hidden">
                        <img src={logo} alt="Logo" className="w-6 h-6 object-contain" />
                     </div>
                     <div>
                        <h1 className="text-emerald-900 font-black text-[10px] tracking-widest uppercase leading-tight">Dopals Tech</h1>
                        <p className="text-[5px] text-gray-500 font-bold uppercase tracking-wide">Official Identity</p>
                     </div>
                 </div>
                 <div className="text-right mt-1">
                     <div className="flex items-center justify-end gap-1 bg-emerald-800/30 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 size={8} className="text-emerald-300" />
                        <p className="text-emerald-100 text-[6px] font-bold tracking-widest uppercase">Verified</p>
                     </div>
                 </div>
             </div>

             {/* CONTENT: Photo & Details */}
             <div className="relative z-20 flex flex-row items-end px-4 mt-1 gap-4 w-full">
                <div className="relative shrink-0 mb-1">
                    <div className="w-[26mm] h-[26mm] rounded-xl overflow-hidden border-[3px] border-white shadow-lg bg-gray-200 relative z-10">
                        <img src={getImageUrl(user.profilePicture) || "https://via.placeholder.com/150"} className="w-full h-full object-cover" crossOrigin="anonymous"/>
                    </div>
                    <div className="absolute top-1 left-1 w-full h-full bg-black/20 rounded-xl blur-sm z-0"></div>
                </div>

                <div className="flex-1 min-w-0 pb-1">
                    <h2 className="text-slate-800 font-black text-sm uppercase leading-tight mb-0.5 break-words">
                        {user.name}
                    </h2>
                    <p className="text-[9px] text-emerald-700 font-bold uppercase tracking-wide mb-3 truncate border-l-2 border-emerald-500 pl-1.5">
                        {user.position || "Staff Member"}
                    </p>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                        <div className="flex flex-col">
                            <span className="text-[5px] text-gray-400 uppercase font-bold">ID Number</span>
                            <span className="text-[8px] font-mono font-bold text-slate-900">DOP-{user._id ? user._id.slice(-6).toUpperCase() : '000'}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[5px] text-gray-400 uppercase font-bold">Joined</span>
                            <span className="text-[8px] font-bold text-slate-900">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="col-span-2 flex flex-col mt-0.5">
                            <span className="text-[5px] text-gray-400 uppercase font-bold">Department</span>
                            <span className="text-[8px] font-bold text-slate-900 truncate leading-tight">{deptDisplay}</span>
                        </div>
                    </div>
                </div>
             </div>

             {/* FOOTER STRIP */}
             <div className="mt-auto relative z-20 w-full bg-slate-900 px-4 py-1 flex justify-between items-center">
                <span className="text-[6px] text-slate-400 tracking-wider">www.dopalstech.com</span>
                <span className="text-[6px] text-emerald-400 font-bold tracking-widest">EXP: DEC {new Date().getFullYear() + 2}</span>
             </div>
          </div>

          {/* --- BACK SIDE --- */}
          <div className="id-card-side flex flex-col relative bg-white">
             <div className="bg-emerald-900 w-full h-8 flex items-center justify-center">
                <h3 className="text-white text-[8px] font-bold tracking-[0.2em] uppercase">Terms & Conditions</h3>
             </div>
             <div className="flex-1 p-4 flex flex-col gap-3">
                 <p className="text-[6px] text-gray-500 text-justify leading-relaxed">
                    This card remains the property of <b>Dopals Technologies</b>. It must be worn at all times while on company premises. Use of this card constitutes acceptance of the company's security policies. If found, please return to the address below.
                 </p>
                 <div className="border border-gray-200 rounded p-1.5 bg-gray-50">
                    <div className="flex items-start gap-1.5">
                        <MapPin size={10} className="text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-[6px] font-bold text-emerald-800 uppercase">Staff Home Address</h4>
                            <p className="text-[7px] text-gray-800 font-bold leading-tight mt-0.5">
                                {user.address || 'Address not provided on file.'}
                            </p>
                        </div>
                    </div>
                 </div>
                 <div className="border border-red-100 rounded p-1.5 bg-red-50/50">
                    <div className="flex items-start gap-1.5">
                        <Heart size={10} className="text-red-600 shrink-0 mt-0.5" />
                        <div className="w-full">
                            <h4 className="text-[6px] font-bold text-red-700 uppercase flex justify-between">
                                <span>Emergency Contact</span>
                                <span className="opacity-70">({user.emergencyContact?.relationship || 'N/A'})</span>
                            </h4>
                            <div className="flex justify-between items-end mt-0.5">
                                <p className="text-[8px] text-gray-900 font-bold leading-tight">
                                    {user.emergencyContact?.name || 'N/A'}
                                </p>
                                <p className="text-[8px] text-gray-900 font-mono font-bold leading-tight">
                                    {user.emergencyContact?.phone || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                 </div>
             </div>

             {/* ✅ SIGNATURE AREA - ENABLED */}
             <div className="px-4 pb-3 flex justify-between items-end">
                <div className="flex flex-col items-center">
                    <div className="w-20 border-b border-gray-300 pb-0.5 mb-0.5 flex justify-center">
                        <img 
                            src={signatureImg} 
                            alt="Sig" 
                            className="h-6 w-auto mix-blend-multiply opacity-90 object-contain" 
                        /> 
                    </div>
                    <span className="text-[5px] text-gray-400 uppercase tracking-wider text-center">Authorized Signature</span>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="text-right">
                        <p className="text-[5px] text-gray-400">Scan to Verify</p>
                        <p className="text-[6px] font-bold text-slate-800">DOP-{user._id ? user._id.slice(-4).toUpperCase() : '0000'}</p>
                    </div>
                    <QrCode size={28} className="text-slate-900" />
                </div>
             </div>
          </div>

        </div>
      </div>

    </div>
  );
};

const InfoItem = ({ label, value }) => (
    <div className="flex flex-col">
        <span className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-bold text-slate-900 dark:text-white break-words">{value || 'N/A'}</span>
    </div>
);

export default StaffDetails;