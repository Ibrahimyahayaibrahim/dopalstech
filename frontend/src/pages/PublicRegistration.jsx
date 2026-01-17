import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../services/api'; 
import { motion, AnimatePresence } from 'framer-motion'; // ✅ Smoother Animations
import { 
  User, Mail, Phone, Calendar, MapPin, CheckCircle, Loader2, 
  AlertCircle, Sparkles, ChevronDown, Lock, FileText, Info
} from 'lucide-react';

import logo from '../assets/logo.png'; 

const PublicRegistration = () => {
  const { id } = useParams(); 
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Core fields
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    consent: false
  });

  // Fetch Program
  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const res = await API.get(`/public/program/${id}`);
        setProgram(res.data);
      } catch (err) {
        setError("Program not found or link expired.");
      } finally {
        setLoading(false);
      }
    };
    fetchProgram();
  }, [id]);

  // Handle Input Change
  const handleChange = (key, value) => {
      setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.email && !formData.phone) {
        setError("Please provide either an Email or Phone number.");
        return;
    }

    if (!formData.consent) {
        setError("You must agree to the terms to continue.");
        return;
    }

    setSubmitting(true);
    try {
      await API.post(`/public/register/${id}`, formData);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterAnother = () => {
    setFormData({ fullName: '', email: '', phone: '', consent: false });
    setSuccess(false);
    setError('');
  };

  // --- HELPERS ---
  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBD';
    const date = new Date(dateString);
    return isNaN(date.getTime()) 
        ? 'Date TBD' 
        : date.toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getHeaderImage = () => {
      if (!program?.flyer) return null;
      let cleanPath = program.flyer.replace(/\\/g, '/');
      if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);
      return cleanPath.startsWith('http') ? `url('${cleanPath}')` : `url('http://localhost:5000/${cleanPath}')`;
  };

  // --- COMPONENT: DYNAMIC FIELD RENDERER ---
  const renderField = (field, index) => {
      const fieldKey = field.label; 
      const val = formData[fieldKey] || '';
      
      const labelClass = "text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block ml-1";
      const inputWrapperClass = "relative flex items-center group transition-all duration-300";
      const inputClass = "w-full p-3.5 pl-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all";

      // Animation for each field
      const fieldAnim = {
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { delay: index * 0.05 } }
      };

      if (field.fieldType === 'checkbox') {
          return (
            <motion.div key={index} variants={fieldAnim} className="mt-4">
                <label className="flex items-start gap-3 cursor-pointer group p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-200 transition-all">
                    <input 
                        type="checkbox"
                        required={field.required}
                        checked={!!val}
                        onChange={e => handleChange(fieldKey, e.target.checked)}
                        className="peer sr-only" 
                    />
                    <div className="w-5 h-5 border-2 border-slate-300 rounded-md peer-checked:bg-emerald-500 peer-checked:border-emerald-500 flex items-center justify-center transition-all mt-0.5">
                        <CheckCircle size={12} className="text-white opacity-0 peer-checked:opacity-100" />
                    </div>
                    <span className="text-sm text-slate-600 font-medium">{field.label} {field.required && <span className="text-red-500">*</span>}</span>
                </label>
            </motion.div>
          );
      }

      return (
          <motion.div key={index} variants={fieldAnim} className={field.fieldType === 'textarea' ? "md:col-span-2" : ""}>
              <label className={labelClass}>{field.label} {field.required && <span className="text-red-500">*</span>}</label>
              <div className={inputWrapperClass}>
                  {field.fieldType === 'textarea' ? (
                      <textarea 
                          className={`${inputClass} min-h-[100px] resize-y`}
                          rows="3"
                          required={field.required}
                          value={val}
                          onChange={e => handleChange(fieldKey, e.target.value)}
                          placeholder={`Enter your ${field.label.toLowerCase()}...`}
                      />
                  ) : field.fieldType === 'select' ? (
                      <div className="relative w-full">
                        <select 
                            className={`${inputClass} appearance-none cursor-pointer`}
                            required={field.required}
                            value={val}
                            onChange={e => handleChange(fieldKey, e.target.value)}
                        >
                            <option value="">Select an option...</option>
                            {field.options?.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-4 text-slate-400 pointer-events-none"/>
                      </div>
                  ) : (
                      <input 
                          type={field.fieldType === 'number' ? 'number' : field.fieldType === 'date' ? 'date' : 'text'}
                          className={inputClass}
                          required={field.required}
                          value={val}
                          onChange={e => handleChange(fieldKey, e.target.value)}
                          placeholder={field.fieldType === 'date' ? '' : `Enter your ${field.label.toLowerCase()}`}
                      />
                  )}
              </div>
          </motion.div>
      );
  };

  // --- LOADING / ERROR STATES ---
  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <Loader2 size={48} className="text-emerald-500 animate-spin mb-4"/>
        <p className="text-emerald-500/60 font-mono text-xs tracking-[0.2em] animate-pulse">LOADING PORTAL</p>
    </div>
  );

  if (error && !program) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm w-full border border-red-100">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={28}/>
            </div>
            <h3 className="text-lg font-bold text-slate-800">Unable to Load</h3>
            <p className="text-slate-500 text-sm mt-2">{error}</p>
        </div>
    </div>
  );

  const isRegistrationClosed = program && (
      program.registration?.isOpen === false || 
      (program.registration?.deadline && new Date() > new Date(program.registration.deadline))
  );

  if (isRegistrationClosed) return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-10 rounded-[2rem] shadow-2xl max-w-md w-full">
                <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock size={32}/>
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Registration Closed</h2>
                <p className="text-slate-500 leading-relaxed">
                    Registration for <strong className="text-slate-900">{program.name}</strong> is currently not accepting new responses.
                </p>
            </motion.div>
        </div>
  );

  const hasCustomFields = program?.registration?.formFields?.length > 0;

  return (
    <div className="min-h-screen bg-slate-900 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 pb-20">
      
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
         <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px]"></div>
         <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Navigation / Header */}
      <header className="relative z-20 px-6 py-6 max-w-6xl mx-auto flex justify-center md:justify-start">
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg">
              <img src={logo} alt="Logo" className="w-8 h-8 object-contain rounded-md" />
              <div className="pr-2">
                  <h1 className="text-white font-bold text-sm tracking-wide leading-none">Dopals Tech</h1>
                  <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider mt-0.5">Event Portal</p>
              </div>
          </motion.div>
      </header>

      <main className="relative z-10 px-4 md:px-6">
        <AnimatePresence mode="wait">
        
        {success ? (
            // --- SUCCESS STATE ---
            <motion.div 
                key="success"
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="max-w-md mx-auto mt-10 bg-white/10 backdrop-blur-2xl border border-white/20 p-10 rounded-[2.5rem] shadow-2xl text-center"
            >
                <div className="w-24 h-24 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/30">
                    <CheckCircle size={48} className="text-white drop-shadow-md"/>
                </div>
                <h2 className="text-3xl font-black text-white mb-3">You're Confirmed!</h2>
                <p className="text-slate-300 mb-8 leading-relaxed">
                    You have successfully registered for <br/>
                    <strong className="text-white text-lg">{program?.name}</strong>
                </p>
                
                <div className="bg-white/5 rounded-2xl p-4 mb-8 border border-white/5">
                    <p className="text-xs text-emerald-300 font-bold uppercase tracking-wider mb-1">What's Next?</p>
                    <p className="text-sm text-slate-400">We've sent a confirmation email with all the details.</p>
                </div>

                <button 
                    onClick={handleRegisterAnother}
                    className="w-full py-4 bg-white text-slate-900 font-bold rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-emerald-50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group"
                >
                    <span className="group-hover:rotate-180 transition-transform duration-500"><Loader2 size={18}/></span> 
                    Register Another Person
                </button>
            </motion.div>
        ) : (
            // --- FORM STATE ---
            <motion.div 
                key="form"
                initial={{ y: 20, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }}
                className="max-w-2xl mx-auto"
            >
                {/* 1. Program Card */}
                <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden mb-6 group">
                    <div className="h-56 relative overflow-hidden bg-slate-900">
                        {program?.flyer ? (
                            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: getHeaderImage() }}>
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                            </div>
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 to-teal-900"></div>
                        )}
                        
                        <div className="absolute bottom-0 left-0 w-full p-8">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest shadow-sm mb-3">
                                <Sparkles size={10} className="text-emerald-400"/> {program.type}
                            </span>
                            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight drop-shadow-lg">
                                {program.name}
                            </h1>
                        </div>
                    </div>
                    
                    <div className="px-8 py-5 bg-white flex flex-col md:flex-row gap-6 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0"><Calendar size={20}/></div>
                            <div><p className="text-[10px] text-slate-400 font-bold uppercase">When</p><p className="text-sm font-bold text-slate-800">{formatDate(program.date)}</p></div>
                        </div>
                        <div className="w-px h-10 bg-slate-100 hidden md:block"></div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0"><MapPin size={20}/></div>
                            <div><p className="text-[10px] text-slate-400 font-bold uppercase">Where</p><p className="text-sm font-bold text-slate-800">{program.venue || 'Venue TBD'}</p></div>
                        </div>
                    </div>
                </div>

                {/* 2. Registration Form */}
                <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 md:p-10 shadow-2xl border border-white/50 relative">
                    
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 border border-red-100 text-sm font-medium animate-shake">
                            <AlertCircle size={20} className="shrink-0"/> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        
                        {/* SECTION 1: CONTACT INFO */}
                        <div className="space-y-5">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">1</span>
                                Contact Information
                            </h3>
                            
                            <div className="grid grid-cols-1 gap-5">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block ml-1">Full Name <span className="text-red-500">*</span></label>
                                    <div className="relative group">
                                        <User size={18} className="absolute left-4 top-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors"/>
                                        <input required className="w-full pl-11 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400" 
                                            placeholder="Enter your full name"
                                            value={formData.fullName}
                                            onChange={e => handleChange('fullName', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block ml-1">Email <span className="text-red-500">*</span></label>
                                        <div className="relative group">
                                            <Mail size={18} className="absolute left-4 top-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors"/>
                                            <input type="email" className="w-full pl-11 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400" 
                                                placeholder="example@mail.com"
                                                value={formData.email}
                                                onChange={e => handleChange('email', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block ml-1">Phone <span className="text-red-500">*</span></label>
                                        <div className="relative group">
                                            <Phone size={18} className="absolute left-4 top-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors"/>
                                            <input type="tel" className="w-full pl-11 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400" 
                                                placeholder="080 1234 5678"
                                                value={formData.phone}
                                                onChange={e => handleChange('phone', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: ADDITIONAL INFO (Dynamic or Default) */}
                        <div className="space-y-5">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">2</span>
                                Participant Details
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {hasCustomFields ? (
                                    // DYNAMIC FIELDS RENDERER
                                    program.registration.formFields.map((field, idx) => (
                                        <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                                            {renderField(field, idx)}
                                        </motion.div>
                                    ))
                                ) : (
                                    // FALLBACK: OLD DEFAULT FIELDS
                                    <>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block ml-1">Gender</label>
                                            <div className="relative">
                                                <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium appearance-none focus:border-emerald-500 outline-none"
                                                    value={formData.gender || ''}
                                                    onChange={e => handleChange('gender', e.target.value)}
                                                >
                                                    <option value="">Select Gender</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                </select>
                                                <ChevronDown size={16} className="absolute right-4 top-4 text-slate-400 pointer-events-none"/>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block ml-1">State of Residence</label>
                                            <input className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:border-emerald-500 outline-none" 
                                                placeholder="e.g. Lagos"
                                                value={formData.state || ''}
                                                onChange={e => handleChange('state', e.target.value)}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block ml-1">Organization / School</label>
                                            <input className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:border-emerald-500 outline-none" 
                                                placeholder="Where do you work or study?"
                                                value={formData.organization || ''}
                                                onChange={e => handleChange('organization', e.target.value)}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* SECTION 3: CONSENT & SUBMIT */}
                        <div className="pt-4 border-t border-slate-100">
                            <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                <div className="relative flex items-center mt-0.5">
                                    <input required type="checkbox" className="peer w-5 h-5 cursor-pointer appearance-none rounded-md border-2 border-slate-300 checked:border-emerald-500 checked:bg-emerald-500 transition-all"
                                        checked={formData.consent}
                                        onChange={e => handleChange('consent', e.target.checked)}
                                    />
                                    <CheckCircle size={12} className="absolute left-1 top-1 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"/>
                                </div>
                                <span className="text-xs text-slate-500 leading-snug font-medium group-hover:text-slate-700 transition-colors">
                                    I hereby confirm that the information provided is accurate and I agree to the terms of registration for this event.
                                </span>
                            </label>

                            <button 
                                disabled={submitting} 
                                className="w-full bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold py-4 rounded-xl shadow-xl shadow-emerald-500/20 transform hover:-translate-y-1 active:translate-y-0 transition-all flex justify-center items-center gap-2 mt-6 text-lg group disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {submitting ? <Loader2 className="animate-spin"/> : <><Sparkles size={20} className="group-hover:rotate-12 transition-transform"/> Secure My Spot</>}
                            </button>
                        </div>

                    </form>
                </div>
                
                <p className="text-center text-slate-500/30 text-[10px] font-bold uppercase tracking-widest mt-8 mb-4">
                    Powered by Dopals Tech Systems © 2026
                </p>

            </motion.div>
        )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default PublicRegistration;