import React, { useState, useEffect } from 'react';
import API from '../services/api';
import FormBuilder from './FormBuilder';
import { X, ArrowRight, ArrowLeft, CheckCircle, Layers, Calendar, Hash, Upload, FileText, Image as ImageIcon } from 'lucide-react';

const AddProgramModal = ({ isOpen, onClose, departmentId, onSuccess, parentProgram = null }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'Training',
    structure: 'One-Time', 
    description: '',
    date: '',
    frequency: '', 
    customSuffix: '',
    cost: 0,
    venue: '',              
    participantsCount: '',  
    formFields: [] 
  });

  const [flyerFile, setFlyerFile] = useState(null);
  const [proposalFile, setProposalFile] = useState(null);

  useEffect(() => {
    if (isOpen) {
        if (parentProgram) {
            setFormData({
                name: '', 
                type: parentProgram.type,
                structure: parentProgram.structure,
                description: parentProgram.description,
                date: '',
                frequency: '',
                customSuffix: '',
                cost: parentProgram.cost,
                venue: parentProgram.venue || '',
                participantsCount: '',
                formFields: [] 
            });
        } else {
            setFormData({ 
                name: '', type: 'Training', structure: 'One-Time', description: '', 
                date: '', frequency: '', customSuffix: '', cost: 0, 
                venue: '', participantsCount: '', formFields: [] 
            });
        }
        setFlyerFile(null);
        setProposalFile(null);
        setStep(1);
    }
  }, [isOpen, parentProgram]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, type) => {
      const file = e.target.files[0];
      if (type === 'flyer') setFlyerFile(file);
      if (type === 'proposal') setProposalFile(file);
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const data = new FormData();
      
      // --- CRITICAL FIX FOR STAFF CREATION ---
      let activeDeptId = departmentId;

      // 1. If Child Program, inherit from Parent
      if (parentProgram) {
          activeDeptId = parentProgram.department?._id || parentProgram.department;
      }

      // 2. If still missing (e.g. Staff on Dashboard), try to find it in User Profile
      if (!activeDeptId) {
          const user = JSON.parse(localStorage.getItem('user'));
          
          if (user && user.departments && user.departments.length > 0) {
              // Handle case where department is an Object { _id: "..." } OR just a String "..."
              const firstDept = user.departments[0];
              activeDeptId = firstDept._id || firstDept; 
          }
      }

      // 3. Final Safety Check
      if (!activeDeptId) {
          alert("Error: Could not identify your Department. Please contact Admin.");
          setLoading(false);
          return;
      }
      
      data.append('departmentId', activeDeptId);
      // ---------------------------------------

      let finalName = formData.name;
      if (parentProgram && !finalName) {
          const suffix = formData.customSuffix || new Date(formData.date || Date.now()).toLocaleDateString();
          finalName = `${parentProgram.name} - ${suffix}`;
      }
      data.append('name', finalName);

      data.append('type', formData.type);
      data.append('structure', formData.structure);
      data.append('description', formData.description);
      data.append('date', formData.date);
      data.append('cost', formData.cost);
      data.append('venue', formData.venue); 
      data.append('participantsCount', formData.participantsCount);

      if (formData.frequency) data.append('frequency', formData.frequency);
      if (formData.customSuffix) data.append('customSuffix', formData.customSuffix);

      if (formData.formFields && formData.formFields.length > 0) {
        data.append('formFields', JSON.stringify(formData.formFields));
      }

      if (parentProgram) {
          data.append('parentId', parentProgram._id);
      }

      if (flyerFile) data.append('flyer', flyerFile);
      if (proposalFile) data.append('proposal', proposalFile);

      await API.post('/programs', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });

      setLoading(false);
      alert(parentProgram ? "New version created successfully!" : "Program created successfully!"); 
      onSuccess(); 
      onClose();   

    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Failed to create program.";
      alert(msg);
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
        
        {parentProgram && (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-4 mb-4">
                <div className="bg-white p-2 rounded-full text-blue-600 shadow-sm"><Layers size={20}/></div>
                <div>
                    <p className="text-xs font-bold text-blue-600 uppercase">Creating Version For:</p>
                    <p className="font-bold text-gray-800 text-lg">{parentProgram.name}</p>
                </div>
            </div>
        )}

        <div>
            <label className="text-xs font-bold text-gray-500 uppercase">
                {parentProgram ? 'Version Name (Optional)' : 'Program Name'}
            </label>
            <input 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 transition-all font-bold text-gray-800 placeholder-gray-300" 
                placeholder={parentProgram ? "Leave empty to auto-generate" : "e.g. Media Internship 2026"} 
                autoFocus={!parentProgram} 
            />
        </div>

        {parentProgram && (
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">
                    {parentProgram.structure === 'Numerical' ? 'Batch Suffix' : 'Version Label'}
                </label>
                <input 
                    name="customSuffix" 
                    value={formData.customSuffix} 
                    onChange={handleChange} 
                    className="w-full p-3 bg-white border border-emerald-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-200 font-bold text-gray-800" 
                    placeholder={parentProgram.structure === 'Numerical' ? "e.g. Batch 5" : "e.g. Jan Cohort"} 
                />
            </div>
        )}

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                <select name="type" value={formData.type} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500">
                    <option value="Training">Training</option>
                    <option value="Event">Event</option>
                    <option value="Project">Project</option>
                    <option value="Pitch-IT">Pitch-IT</option>
                </select>
            </div>
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Start Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500" />
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Venue / Location</label>
                <input 
                    name="venue" 
                    value={formData.venue} 
                    onChange={handleChange} 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 text-sm font-bold" 
                    placeholder="e.g. Main Hall or Zoom" 
                />
            </div>
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Expected Beneficiaries</label>
                <input 
                    type="number" 
                    name="participantsCount" 
                    value={formData.participantsCount} 
                    onChange={handleChange} 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 text-sm font-bold" 
                    placeholder="0" 
                />
            </div>
        </div>

        {!parentProgram && (
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <label className="text-xs font-bold text-emerald-700 uppercase mb-3 block">Program Structure</label>
                <div className="grid grid-cols-3 gap-3">
                    {['One-Time', 'Recurring', 'Numerical'].map((opt) => (
                        <button 
                            key={opt}
                            onClick={() => setFormData({ ...formData, structure: opt })}
                            className={`p-2 rounded-lg text-xs font-bold border transition-all flex flex-col items-center gap-1
                            ${formData.structure === opt 
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' 
                                : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-300'}`}
                        >
                            {opt === 'One-Time' && <Calendar size={16}/>}
                            {opt === 'Recurring' && <Layers size={16}/>}
                            {opt === 'Numerical' && <Hash size={16}/>}
                            {opt}
                        </button>
                    ))}
                </div>
                 {formData.structure === 'Recurring' && (
                    <div className="mt-4 animate-in fade-in">
                        <label className="text-xs font-bold text-gray-500 uppercase">Frequency</label>
                        <input name="frequency" value={formData.frequency} onChange={handleChange} className="w-full p-2 bg-white border border-emerald-200 rounded-lg text-sm" placeholder="e.g. Weekly on Mondays" />
                    </div>
                )}
            </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="relative group">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Program Flyer</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-all h-24 relative overflow-hidden">
                    {flyerFile ? (
                        <div className="z-10 flex flex-col items-center">
                            <ImageIcon size={20} className="text-emerald-600 mb-1"/>
                            <p className="text-[10px] text-gray-600 font-bold truncate w-20">{flyerFile.name}</p>
                        </div>
                    ) : (
                        <div className="z-10 flex flex-col items-center">
                            <Upload size={20} className="text-gray-400 mb-1"/>
                            <p className="text-[10px] text-gray-400">Click to Upload Image</p>
                        </div>
                    )}
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'flyer')} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
            </div>

            <div className="relative group">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Proposal Doc</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all h-24 relative overflow-hidden">
                    {proposalFile ? (
                        <div className="z-10 flex flex-col items-center">
                            <FileText size={20} className="text-blue-600 mb-1"/>
                            <p className="text-[10px] text-gray-600 font-bold truncate w-20">{proposalFile.name}</p>
                        </div>
                    ) : (
                        <div className="z-10 flex flex-col items-center">
                            <Upload size={20} className="text-gray-400 mb-1"/>
                            <p className="text-[10px] text-gray-400">Click to Upload PDF</p>
                        </div>
                    )}
                    <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => handleFileChange(e, 'proposal')} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
            </div>
        </div>

        <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 resize-none text-sm" placeholder="Brief overview..." />
        </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="animate-in slide-in-from-right-4 fade-in duration-300 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {parentProgram ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <Layers className="text-gray-300 mb-4" size={48} />
                <h3 className="text-lg font-bold text-gray-600">Form Inherited</h3>
                <p className="text-sm text-gray-400 mt-2">
                    This version will automatically use the registration questions defined in the <strong>Parent Program</strong>.
                </p>
            </div>
        ) : (
            <>
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Registration Form</h3>
                    <p className="text-sm text-gray-500">Define what applicants need to provide.</p>
                </div>
                <FormBuilder fields={formData.formFields} setFields={(newFields) => setFormData({ ...formData, formFields: newFields })} />
            </>
        )}
    </div>
  );

  const renderStep3 = () => (
    <div className="animate-in slide-in-from-right-4 fade-in duration-300 space-y-6 text-center py-6">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-4">
            <CheckCircle size={40} />
        </div>
        <div>
            <h3 className="text-2xl font-bold text-gray-800">Ready to Launch?</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-2">
                {parentProgram 
                    ? (formData.name ? `Creating: "${formData.name}"` : `Creating new version...`)
                    : `Creating "${formData.name}"`
                }
            </p>
        </div>
        <div className="flex justify-center gap-4 text-xs font-bold text-gray-400">
            {flyerFile && <span className="flex items-center gap-1 text-emerald-600"><CheckCircle size={12}/> Flyer Attached</span>}
            {proposalFile && <span className="flex items-center gap-1 text-blue-600"><CheckCircle size={12}/> Proposal Attached</span>}
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div>
                <h2 className="text-xl font-bold text-gray-800">{parentProgram ? 'Create New Version' : 'Create New Program'}</h2>
                <div className="flex gap-2 mt-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${step >= i ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
                    ))}
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-gray-500"/></button>
        </div>

        <div className="p-8 overflow-y-auto flex-1">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
            {step > 1 ? (
                <button onClick={handleBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-bold text-sm px-4 py-2">
                    <ArrowLeft size={16}/> Back
                </button>
            ) : <div></div>}

            {step < 3 ? (
                <button 
                    onClick={handleNext} 
                    disabled={!parentProgram && !formData.name}
                    className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-200"
                >
                    Next Step <ArrowRight size={16}/>
                </button>
            ) : (
                <button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className="bg-emerald-600 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"
                >
                    {loading ? 'Creating...' : 'Launch'}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default AddProgramModal;