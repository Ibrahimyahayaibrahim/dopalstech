import { useState } from 'react';
import API from '../services/api';
import { 
  User, Phone, Calendar, FileText, CheckCircle, Heart, Linkedin, 
  ChevronRight, AlertTriangle, Lock, ShieldCheck, ChevronLeft 
} from 'lucide-react';

const CompleteProfileModal = ({ user, onClose, onUpdate }) => {
  // If profile is already complete, don't show this modal
  if (user?.isProfileComplete) return null;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Consolidated Form State
  const [formData, setFormData] = useState({
    // --- Step 1: Security (REQUIRED for the reset) ---
    newPassword: '',
    confirmPassword: '',
    
    // --- Step 2: Personal (RESTORED ALL FIELDS) ---
    phone: user?.phone || '',
    gender: user?.gender || '',
    dob: user?.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
    address: user?.address || '',
    nin: user?.nin || '',
    
    // --- Step 3: Emergency ---
    emergencyName: user?.emergencyContact?.name || '',
    emergencyRel: user?.emergencyContact?.relationship || '',
    emergencyPhone: user?.emergencyContact?.phone || '',
    
    // --- Step 4: Professional ---
    bio: user?.bio || '',
    linkedin: user?.linkedin || ''
  });

  // Validation Logic
  const validateStep = (currentStep) => {
      setError('');
      
      // Step 1: Password Validation
      if (currentStep === 1) {
          if (!formData.newPassword || !formData.confirmPassword) {
              setError("Please create a new password.");
              return false;
          }
          if (formData.newPassword !== formData.confirmPassword) {
              setError("Passwords do not match.");
              return false;
          }
          if (formData.newPassword.length < 6) {
              setError("Password must be at least 6 characters.");
              return false;
          }
          return true;
      }

      // Step 2: Personal Validation
      if (currentStep === 2) {
          if (!formData.phone || !formData.gender || !formData.dob || !formData.address || !formData.nin) {
              setError("Please fill all personal details (NIN, DOB, Address).");
              return false;
          }
          return true;
      }

      // Step 3: Emergency Validation
      if (currentStep === 3) {
          if (!formData.emergencyName || !formData.emergencyRel || !formData.emergencyPhone) {
              setError("Emergency contact info is required.");
              return false;
          }
          return true;
      }

      return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Create the payload matching backend structure
      const payload = {
          ...formData,
          // Send password update
          password: formData.newPassword, 
          // Structure emergency contact
          emergencyContact: {
              name: formData.emergencyName,
              relationship: formData.emergencyRel,
              phone: formData.emergencyPhone
          },
          // ✅ FORCE STATUS UPDATE
          isProfileComplete: true 
      };

      const { data } = await API.put('/users/profile', payload);
      
      // ✅ Update LocalStorage immediately
      const updatedUser = { 
          ...user, 
          ...data, 
          isProfileComplete: true,
          status: 'Active' 
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      if (onUpdate) onUpdate(updatedUser);
      if (onClose) onClose(); 
      
      // Force reload to ensure clean state
      window.location.href = '/dashboard';

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-emerald-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Progress Header */}
        <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
           <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <ShieldCheck className="text-emerald-600"/> Setup Your Profile
              </h2>
              <p className="text-xs text-gray-400 mt-1">Step {step} of 4</p>
           </div>
           <div className="flex gap-2">
               {[1,2,3,4].map(s => (
                   <div key={s} className={`h-1.5 w-8 rounded-full transition-all duration-300 ${step >= s ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
               ))}
           </div>
        </div>

        {/* Wizard Body */}
        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
           
           {/* --- STEP 1: SECURITY (Must be first to fix the "123456" issue) --- */}
           {step === 1 && (
               <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                   <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex gap-4 items-start">
                       <div className="bg-white p-2 rounded-full text-red-500 shadow-sm"><Lock size={20}/></div>
                       <div>
                           <h3 className="font-bold text-red-700 text-sm">Action Required: Secure Account</h3>
                           <p className="text-xs text-red-600/80 mt-1">Please create a new secure password to proceed.</p>
                       </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <Input label="New Password" type="password" value={formData.newPassword} onChange={e=>setFormData({...formData, newPassword: e.target.value})} placeholder="••••••••" icon={<Lock size={14}/>} />
                       <Input label="Confirm Password" type="password" value={formData.confirmPassword} onChange={e=>setFormData({...formData, confirmPassword: e.target.value})} placeholder="••••••••" icon={<CheckCircle size={14}/>} />
                   </div>
               </div>
           )}

           {/* --- STEP 2: PERSONAL (RESTORED ALL FIELDS) --- */}
           {step === 2 && (
               <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                   <h3 className="text-lg font-bold text-emerald-800 flex items-center gap-2 pb-2 border-b border-gray-100"><User size={20}/> Personal Details</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <Input label="Phone Number" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} placeholder="+234..." icon={<Phone size={14}/>} />
                       <Select label="Gender" value={formData.gender} onChange={e=>setFormData({...formData, gender: e.target.value})} options={['Male','Female']} />
                       <Input label="Date of Birth" type="date" value={formData.dob} onChange={e=>setFormData({...formData, dob: e.target.value})} icon={<Calendar size={14}/>} />
                       <Input label="NIN (National ID)" value={formData.nin} onChange={e=>setFormData({...formData, nin: e.target.value})} placeholder="11-digit ID" icon={<FileText size={14}/>} />
                       <div className="md:col-span-2">
                           <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Home Address</label>
                           <textarea className="w-full p-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none resize-none h-20 transition-all text-sm font-medium" value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})}></textarea>
                       </div>
                   </div>
               </div>
           )}

           {/* --- STEP 3: EMERGENCY --- */}
           {step === 3 && (
               <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                   <h3 className="text-lg font-bold text-amber-600 flex items-center gap-2 pb-2 border-b border-gray-100"><Heart size={20}/> Emergency Contact</h3>
                   <div className="bg-amber-50 p-4 rounded-xl text-amber-800 text-sm flex gap-3 items-center">
                       <AlertTriangle size={20}/> 
                       <span>Required for your safety in case of workplace emergencies.</span>
                   </div>
                   <Input label="Contact Name" value={formData.emergencyName} onChange={e=>setFormData({...formData, emergencyName: e.target.value})} placeholder="e.g. Mrs. Sarah Doe" />
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <Input label="Relationship" value={formData.emergencyRel} onChange={e=>setFormData({...formData, emergencyRel: e.target.value})} placeholder="e.g. Spouse, Father" />
                       <Input label="Emergency Phone" value={formData.emergencyPhone} onChange={e=>setFormData({...formData, emergencyPhone: e.target.value})} placeholder="+234..." icon={<Phone size={14}/>} />
                   </div>
               </div>
           )}

           {/* --- STEP 4: PROFESSIONAL --- */}
           {step === 4 && (
               <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                   <h3 className="text-lg font-bold text-blue-600 flex items-center gap-2 pb-2 border-b border-gray-100"><Linkedin size={20}/> Professional Info</h3>
                   <p className="text-sm text-gray-500">Optional: Help the team get to know you better.</p>
                   
                   <Input label="LinkedIn URL (Optional)" value={formData.linkedin} onChange={e=>setFormData({...formData, linkedin: e.target.value})} placeholder="https://linkedin.com/in/..." />
                   <div>
                       <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Short Bio (Optional)</label>
                       <textarea className="w-full p-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none resize-none h-24 transition-all text-sm font-medium" placeholder="Tell us about yourself..." value={formData.bio} onChange={e=>setFormData({...formData, bio: e.target.value})}></textarea>
                   </div>
               </div>
           )}

           {/* Error Message Display */}
           {error && (
               <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl flex items-center justify-center gap-2 animate-pulse">
                   <AlertTriangle size={16}/> {error}
               </div>
           )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            {step > 1 ? (
                <button onClick={() => setStep(step - 1)} className="px-6 py-2 text-gray-500 font-bold hover:bg-gray-200 rounded-xl transition-colors flex items-center gap-2">
                    <ChevronLeft size={16}/> Back
                </button>
            ) : (
                <div></div> 
            )}
            
            {step < 4 ? (
                <button 
                    onClick={() => validateStep(step) && setStep(step + 1)} 
                    className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 flex items-center gap-2 transition-all active:scale-95"
                >
                    Next Step <ChevronRight size={16}/>
                </button>
            ) : (
                <button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className="px-8 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                >
                    {loading ? 'Saving...' : <><CheckCircle size={18}/> Finish & Save</>}
                </button>
            )}
        </div>

      </div>
    </div>
  );
};

// UI Helpers (Restored your exact style)
const Input = ({ label, value, onChange, type="text", placeholder, icon }) => (
    <div>
        <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1 mb-1.5">{icon} {label}</label>
        <input type={type} className="w-full p-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none transition-all mt-1" value={value} onChange={onChange} placeholder={placeholder} />
    </div>
);
const Select = ({ label, value, onChange, options }) => (
    <div>
        <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">{label}</label>
        <select className="w-full p-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none transition-all mt-1 bg-white" value={value} onChange={onChange}>
            <option value="">Select...</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
    </div>
);

export default CompleteProfileModal;