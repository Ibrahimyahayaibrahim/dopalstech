import { useState, useRef, useMemo } from 'react';
import {
  X,
  Search,
  Trash2,
  Mail,
  Phone,
  Users,
  FileSpreadsheet,
  Plus,
  Upload,
  Save,
  Loader2,
  Tag,
  ChevronDown,
} from 'lucide-react';
import API from '../services/api';

const ManageParticipantsModal = ({ isOpen, onClose, program, onSuccess }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  // mobile actions collapse
  const [showActions, setShowActions] = useState(false);

  // Form state
  const [coreData, setCoreData] = useState({ fullName: '', email: '', phone: '' });
  const [dynamicData, setDynamicData] = useState({});

  const fileInputRef = useRef(null);

  // SAFE DATA HANDLING
  const validParticipants = useMemo(() => {
    if (!program || !program.participants) return [];
    return program.participants.filter((p) => p !== null && p !== undefined);
  }, [program]);

  // Search
  const filteredParticipants = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return validParticipants.filter((p) => {
      if (!term) return true;

      if (typeof p === 'string') return p.toLowerCase().includes(term);

      const coreMatch =
        (p.fullName && p.fullName.toLowerCase().includes(term)) ||
        (p.email && p.email.toLowerCase().includes(term)) ||
        (p.phone && p.phone.toLowerCase().includes(term));

      const customMatch =
        p.data &&
        Object.values(p.data).some((val) => String(val).toLowerCase().includes(term));

      const legacyMatch =
        (p.organization && p.organization.toLowerCase().includes(term)) ||
        (p.state && p.state.toLowerCase().includes(term));

      return coreMatch || customMatch || legacyMatch;
    });
  }, [validParticipants, searchTerm]);

  if (!isOpen || !program) return null;

  /* ---------------- ACTIONS ---------------- */

  const handleCoreChange = (key, value) => {
    setCoreData((prev) => ({ ...prev, [key]: value }));
  };

  const handleDynamicChange = (label, value) => {
    setDynamicData((prev) => ({ ...prev, [label]: value }));
  };

  const handleAddManual = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...coreData, ...dynamicData };
      await API.post(`/programs/${program._id}/participants/add`, payload);

      onSuccess?.();
      setIsAdding(false);
      setCoreData({ fullName: '', email: '', phone: '' });
      setDynamicData({});
      alert('Participant added successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add participant');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (participantId) => {
    if (!participantId) return alert('Cannot remove this legacy record.');
    if (!window.confirm('Are you sure you want to remove this participant?')) return;

    setDeleting(participantId);
    try {
      await API.delete(`/programs/${program._id}/participants/${participantId}`);
      onSuccess?.();
    } catch (err) {
      alert('Failed to remove participant');
    } finally {
      setDeleting(null);
    }
  };

  // Merge data for display
  const getParticipantAttributes = (p) => {
    const attrs = [];

    if (p.ageGroup) attrs.push({ label: 'Age Group', value: p.ageGroup });
    if (p.gender) attrs.push({ label: 'Gender', value: p.gender });
    if (p.organization) attrs.push({ label: 'Org', value: p.organization });
    if (p.state) attrs.push({ label: 'State', value: p.state });

    if (p.data) {
      Object.entries(p.data).forEach(([key, val]) => {
        if (!['gender', 'state', 'organization', 'age'].includes(key.toLowerCase())) {
          attrs.push({ label: key, value: val });
        }
      });
    }
    return attrs;
  };

  const handleExportCSV = () => {
    if (!validParticipants.length) return alert('No data to export');

    const headers = ['Full Name', 'Email', 'Phone', 'Date', 'Source', 'Attributes'];

    const rows = validParticipants.map((p) => {
      if (typeof p === 'string') return [p, '', '', '', '', ''];

      const attributes = getParticipantAttributes(p)
        .map((a) => `${a.label}: ${a.value}`)
        .join('; ');

      return [
        `"${p.fullName || ''}"`,
        `"${p.email || ''}"`,
        `"${p.phone || ''}"`,
        `"${new Date(p.createdAt).toLocaleDateString()}"`,
        `"${p.referralSource || ''}"`,
        `"${attributes}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `${program.name}_Participants.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const rows = text.split('\n').slice(1);

      const importedData = rows
        .map((row) => {
          const cols = row.split(',');
          if (cols.length < 2) return null;
          return {
            fullName: cols[0]?.replace(/"/g, '').trim(),
            email: cols[1]?.replace(/"/g, '').trim(),
            phone: cols[2]?.replace(/"/g, '').trim(),
            organization: cols[4]?.replace(/"/g, '').trim(),
          };
        })
        .filter((p) => p && (p.email || p.phone));

      if (importedData.length === 0) return alert('No valid data found');

      setLoading(true);
      try {
        await API.post(`/programs/${program._id}/participants/import`, { participants: importedData });
        alert('Import successful!');
        onSuccess?.();
      } catch (err) {
        alert(err.response?.data?.message || err.message || 'Import failed');
      } finally {
        setLoading(false);
        e.target.value = '';
      }
    };

    reader.readAsText(file);
  };

  /* ---------------- UI HELPERS ---------------- */

  const total = validParticipants.length;
  const shown = filteredParticipants.length;

  const initials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(Boolean);
    const a = parts[0]?.[0] || '';
    const b = parts[1]?.[0] || '';
    return (a + b).toUpperCase() || parts[0][0].toUpperCase();
  };

  /* ---------------- RENDER ---------------- */

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[92vh] sm:h-[85vh] border border-slate-200">

        {/* HEADER */}
        <div className="sticky top-0 z-20 bg-white/85 backdrop-blur border-b border-slate-200">
          <div className="p-4 sm:p-6 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Users className="text-emerald-600" size={20} /> Manage Participants
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {program.name} •{' '}
                  <span className="font-bold text-emerald-700">{total} Registered</span>
                  {searchTerm ? (
                    <>
                      {' '}
                      • <span className="font-bold text-slate-700">{shown} shown</span>
                    </>
                  ) : null}
                </p>
              </div>

              <button
                onClick={onClose}
                className="shrink-0 p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search + Actions row */}
            {!isAdding ? (
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="Search participants…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Desktop actions */}
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    onClick={() => setIsAdding(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition"
                  >
                    <Plus size={18} /> Add New
                  </button>

                  <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

                  <button
                    onClick={handleImportClick}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Upload size={18} /> Import
                  </button>

                  <button
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-50 border border-emerald-100 text-emerald-800 hover:bg-emerald-100 transition"
                  >
                    <FileSpreadsheet size={18} /> Export
                  </button>
                </div>

                {/* Mobile actions dropdown */}
                <div className="sm:hidden">
                  <button
                    onClick={() => setShowActions((s) => !s)}
                    className="w-full inline-flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                  >
                    Actions <ChevronDown size={18} className={`transition ${showActions ? 'rotate-180' : ''}`} />
                  </button>

                  {showActions && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setShowActions(false);
                          setIsAdding(true);
                        }}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition"
                      >
                        <Plus size={16} /> Add
                      </button>

                      <button
                        onClick={() => {
                          setShowActions(false);
                          handleImportClick();
                        }}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                      >
                        <Upload size={16} /> Import
                      </button>

                      <button
                        onClick={() => {
                          setShowActions(false);
                          handleExportCSV();
                        }}
                        className="col-span-2 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold bg-emerald-50 border border-emerald-100 text-emerald-800 hover:bg-emerald-100 transition"
                      >
                        <FileSpreadsheet size={16} /> Export CSV
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* ADD FORM */}
            {isAdding && (
              <div className="mt-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5 animate-in slide-in-from-top duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-bold text-emerald-900">Register New Beneficiary</div>
                  <button
                    onClick={() => setIsAdding(false)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition"
                  >
                    <X size={16} /> Cancel
                  </button>
                </div>

                <form onSubmit={handleAddManual} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Core */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Full Name *</label>
                    <input
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                      required
                      value={coreData.fullName}
                      onChange={(e) => handleCoreChange('fullName', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Email *</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                      required
                      value={coreData.email}
                      onChange={(e) => handleCoreChange('email', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Phone *</label>
                    <input
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                      required
                      value={coreData.phone}
                      onChange={(e) => handleCoreChange('phone', e.target.value)}
                    />
                  </div>

                  {/* Dynamic fields */}
                  {program.registration?.formFields?.map((field, idx) => (
                    <div key={idx} className="space-y-1">
                      <label className="text-[10px] font-bold text-emerald-800 uppercase">
                        {field.label} {field.required ? '*' : ''}
                      </label>

                      {field.fieldType === 'textarea' ? (
                        <textarea
                          rows={1}
                          required={field.required}
                          onChange={(e) => handleDynamicChange(field.label, e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-emerald-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                        />
                      ) : field.fieldType === 'select' ? (
                        <select
                          required={field.required}
                          onChange={(e) => handleDynamicChange(field.label, e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-emerald-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                        >
                          <option value="">Select…</option>
                          {field.options?.map((opt, i) => (
                            <option key={i} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.fieldType}
                          required={field.required}
                          onChange={(e) => handleDynamicChange(field.label, e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-emerald-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                        />
                      )}
                    </div>
                  ))}

                  <div className="col-span-full flex flex-col sm:flex-row sm:items-center justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                      Save Participant
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-auto bg-slate-50">
          {/* MOBILE: CARDS */}
          <div className="sm:hidden p-3 space-y-3">
            {filteredParticipants.length === 0 ? (
              <div className="p-10 text-center text-slate-400 italic">No participants found.</div>
            ) : (
              filteredParticipants.map((p, idx) => {
                const obj = typeof p === 'object';
                const pid = obj ? p._id : null;
                const attrs = obj ? getParticipantAttributes(p) : [];
                const source = obj ? (p.referralSource || 'Legacy') : 'Legacy';

                return (
                  <div key={pid || idx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-extrabold text-xs">
                          {obj ? initials(p.fullName) : '?'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">{obj ? p.fullName : 'Unknown'}</div>
                          <div className="mt-1 inline-flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              {source}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => obj && pid && handleRemove(pid)}
                        disabled={deleting === pid || !obj}
                        className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 disabled:opacity-50 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mt-3 space-y-1 text-xs text-slate-700">
                      <div className="flex items-center gap-2">
                        <Mail size={12} className="text-slate-400" />
                        <span className="truncate">{obj ? p.email : p}</span>
                      </div>
                      {obj && p.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone size={12} className="text-slate-400" />
                          <span className="truncate">{p.phone}</span>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {obj ? (
                        attrs.length ? (
                          attrs.slice(0, 6).map((a, i) => (
                            <div
                              key={i}
                              className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-[11px] text-emerald-800"
                            >
                              <Tag size={10} className="text-emerald-600" />
                              <span className="font-bold uppercase">{a.label}:</span>
                              <span className="max-w-[120px] truncate">{String(a.value)}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No extra data</span>
                        )
                      ) : (
                        <span className="text-xs text-slate-400">Legacy record</span>
                      )}
                    </div>

                    {obj && attrs.length > 6 ? (
                      <div className="mt-2 text-[11px] font-semibold text-emerald-700">
                        +{attrs.length - 6} more
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>

          {/* DESKTOP/TABLET: TABLE */}
          <div className="hidden sm:block">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Participant</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-[40%]">
                    Attributes / Data
                  </th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-10 text-center text-slate-400 italic">
                      No participants found.
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((p, idx) => {
                    const obj = typeof p === 'object';
                    const pid = obj ? p._id : null;
                    const attrs = obj ? getParticipantAttributes(p) : [];
                    const source = obj ? (p.referralSource || 'Legacy') : 'Legacy';

                    return (
                      <tr key={pid || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-extrabold text-xs uppercase">
                              {obj ? initials(p.fullName) : '?'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">
                                {obj ? p.fullName : 'Unknown'}
                              </p>
                              <span className="mt-1 inline-flex text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                {source}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="space-y-1 text-xs text-slate-700">
                            <div className="flex items-center gap-2">
                              <Mail size={12} className="text-slate-400" />
                              <span className="truncate">{obj ? p.email : p}</span>
                            </div>
                            {obj && p.phone ? (
                              <div className="flex items-center gap-2">
                                <Phone size={12} className="text-slate-400" />
                                <span className="truncate">{p.phone}</span>
                              </div>
                            ) : null}
                          </div>
                        </td>

                        <td className="p-4">
                          {obj ? (
                            <div className="flex flex-wrap gap-2">
                              {attrs.length ? (
                                attrs.map((a, i) => (
                                  <div
                                    key={i}
                                    className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-[11px] text-emerald-800"
                                    title={`${a.label}: ${a.value}`}
                                  >
                                    <Tag size={10} className="text-emerald-600" />
                                    <span className="font-bold uppercase">{a.label}:</span>
                                    <span className="max-w-[160px] truncate">{String(a.value)}</span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-xs text-slate-400 italic">No additional data</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Legacy record</span>
                          )}
                        </td>

                        <td className="p-4 text-right">
                          <button
                            onClick={() => obj && pid && handleRemove(pid)}
                            disabled={deleting === pid || !obj}
                            className="inline-flex items-center justify-center p-2 rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 disabled:opacity-50 transition"
                          >
                            {deleting === pid ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer hint */}
        <div className="border-t border-slate-200 bg-white p-3 text-center text-[11px] text-slate-500">
          Tip: Search matches name, email, phone, and custom form fields.
        </div>
      </div>
    </div>
  );
};

export default ManageParticipantsModal;
