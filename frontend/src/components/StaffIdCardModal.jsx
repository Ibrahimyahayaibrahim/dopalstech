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
} from 'lucide-react';

const StaffIdCardModal = ({ user, onClose }) => {
  if (!user) return null;

  const printRef = useRef(null);

  // Helper to handle image paths correctly
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
  const deptName = user.department?.name || 'Unassigned';

  const handlePrint = () => {
    // Print ONLY the card area using a temporary print stylesheet
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank', 'width=900,height=650');
    if (!printWindow) return;

    const styles = `
      <style>
        @page { size: A4; margin: 16mm; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; background: #fff; }
        .print-wrap { width: 100%; }
        /* Optional: prevent awkward breaks */
        .no-break { break-inside: avoid; page-break-inside: avoid; }
      </style>
    `;

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Staff ID Card</title>
          ${styles}
        </head>
        <body>
          <div class="print-wrap">
            ${content.outerHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();

    // Wait a bit for images to load then print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white overflow-y-auto animate-in fade-in duration-200">
      {/* Top actions (close + print) */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[110] flex items-center gap-2">
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur border border-slate-200 px-4 py-2 text-slate-700 hover:bg-white hover:text-slate-900 shadow-sm transition"
        >
          <Printer size={18} />
          <span className="text-sm font-extrabold hidden sm:inline">Print ID</span>
        </button>

        <button
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-full bg-white/80 backdrop-blur border border-slate-200 p-3 text-slate-700 hover:bg-white hover:text-slate-900 shadow-sm transition"
          aria-label="Close"
        >
          <X size={22} />
        </button>
      </div>

      <div className="min-h-screen flex flex-col">
        {/* HERO */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 text-white">
          {/* Soft glow */}
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-28 sm:pb-32">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              {/* Left */}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] sm:text-xs font-extrabold tracking-widest">
                    {roleLabel}
                  </span>

                  {isActive ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[10px] sm:text-xs font-extrabold text-emerald-100">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                      ACTIVE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-400/10 px-3 py-1 text-[10px] sm:text-xs font-extrabold text-red-100">
                      SUSPENDED
                    </span>
                  )}

                  {user.position ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] sm:text-xs font-bold text-white/90">
                      {user.position}
                    </span>
                  ) : null}
                </div>

                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight break-words">
                  {user.name}
                </h1>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-white/85">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-semibold">
                    <Building2 size={14} className="text-emerald-200" />
                    {deptName}
                  </span>

                  {user.createdAt ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-semibold">
                      <Clock size={14} className="text-emerald-200" />
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Right mini panel */}
              <div className="w-full lg:w-auto">
                <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur px-4 py-3">
                  <p className="text-[10px] uppercase font-extrabold tracking-[0.2em] text-emerald-200/90">
                    Department
                  </p>
                  <p className="mt-1 text-lg font-bold text-white break-words">{deptName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 bg-slate-50">
          {/* ✅ Fix: safer overlap so header never hides photo */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-12 pb-16">
            {/* PRINT AREA START */}
            <div ref={printRef} className="no-break">
              {/* Profile + Summary */}
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
                  {/* Profile */}
                  <div className="bg-white p-2 rounded-[2rem] shadow-xl border border-slate-200 inline-block">
                    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-[1.6rem] overflow-hidden bg-emerald-100 flex items-center justify-center text-4xl sm:text-5xl font-extrabold text-emerald-700 border border-slate-200">
                      {user.profilePicture ? (
                        <img
                          src={getImageUrl(user.profilePicture)}
                          className="w-full h-full object-cover"
                          alt="Profile"
                        />
                      ) : (
                        (user.name?.[0] || '?').toUpperCase()
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase font-extrabold tracking-[0.2em] text-slate-400">
                      Quick Summary
                    </p>

                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <MiniPill icon={<Mail size={14} />} label="Email" value={user.email} />
                      <MiniPill icon={<Phone size={14} />} label="Phone" value={user.phone} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Main grid */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left */}
                <div className="lg:col-span-2 space-y-6">
                  <SectionCard
                    title="Personal Details"
                    icon={<User size={18} className="text-emerald-600" />}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                      <InfoItem label="Email Address" value={user.email} icon={<Mail size={16} />} />
                      <InfoItem label="Phone Number" value={user.phone} icon={<Phone size={16} />} />
                      <InfoItem
                        label="Date of Birth"
                        value={user.dob ? new Date(user.dob).toLocaleDateString() : 'N/A'}
                        icon={<Calendar size={16} />}
                      />
                      <InfoItem label="Gender" value={user.gender} icon={<User size={16} />} />
                    </div>
                  </SectionCard>

                  <SectionCard
                    title="Security & Location"
                    icon={<Shield size={18} className="text-emerald-600" />}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                      <InfoItem label="NIN (National ID)" value={user.nin} icon={<FileText size={16} />} />
                      <InfoItem label="Home Address" value={user.address} icon={<MapPin size={16} />} />
                    </div>
                  </SectionCard>
                </div>

                {/* Right */}
                <div className="space-y-6">
                  <div className="rounded-3xl border border-red-100 bg-red-50 p-5 sm:p-6">
                    <h3 className="text-sm font-extrabold text-red-900 mb-4 flex items-center gap-2">
                      <Heart size={18} className="text-red-600" />
                      Emergency Contact
                    </h3>

                    <div className="space-y-4">
                      <InfoItem label="Name" value={user.emergencyContact?.name} />
                      <InfoItem label="Relationship" value={user.emergencyContact?.relationship} />

                      <div className="pt-4 border-t border-red-200">
                        <p className="text-[10px] font-extrabold text-red-400 uppercase tracking-[0.2em] mb-1">
                          Emergency Phone
                        </p>
                        <p className="text-lg font-extrabold text-red-700 break-words">
                          {user.emergencyContact?.phone || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {(user.bio || user.linkedin) && (
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                      {user.linkedin && (
                        <a
                          href={user.linkedin}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-3 font-extrabold text-emerald-700 hover:text-emerald-800 transition"
                        >
                          <span className="p-2 rounded-full bg-emerald-50 border border-emerald-100">
                            <Linkedin size={18} />
                          </span>
                          View LinkedIn Profile
                        </a>
                      )}

                      {user.bio && (
                        <div className={`${user.linkedin ? 'mt-5' : ''}`}>
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-2">
                            About
                          </p>
                          <p className="text-sm text-slate-600 leading-relaxed italic break-words">
                            “{user.bio}”
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {user.createdAt ? (
                    <div className="text-center text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 opacity-70 flex items-center justify-center gap-2">
                      <Clock size={10} />
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            {/* PRINT AREA END */}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- UI SUB COMPONENTS ---------------- */

const SectionCard = ({ title, icon, children }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm">
    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mb-5 flex items-center gap-2">
      {icon}
      {title}
    </h3>
    {children}
  </div>
);

const MiniPill = ({ icon, label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 flex items-start gap-2 min-w-0">
    <span className="mt-0.5 text-slate-400">{icon}</span>
    <div className="min-w-0">
      <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </div>
      <div className="text-sm font-semibold text-slate-800 truncate">{value || '—'}</div>
    </div>
  </div>
);

const InfoItem = ({ label, value, icon }) => (
  <div className="min-w-0">
    <div className="flex items-center gap-2 mb-1">
      {icon ? <span className="text-slate-400">{icon}</span> : null}
      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">
        {label}
      </span>
    </div>
    <p className="font-semibold text-slate-900 text-sm sm:text-base break-words leading-tight">
      {value || <span className="text-slate-300 italic font-semibold">Not Provided</span>}
    </p>
  </div>
);

export default StaffIdCardModal;
