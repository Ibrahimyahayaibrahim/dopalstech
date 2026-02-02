import React, { useState, useEffect } from 'react';
import API from '../services/api';
import FormBuilder from './FormBuilder';
import { 
    X, ArrowRight, ArrowLeft, CheckCircle, Layers, Calendar, 
    Hash, Upload, FileText, Image as ImageIcon, Archive, 
    FileCheck, Loader2
} from 'lucide-react';

import { useUI } from '../context/UIContext';

const AddProgramModal = ({ isOpen, onClose, departmentId, onSuccess, parentProgram = null }) => {
  const { showToast } = useUI();

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
    formFields: [],
    completionComment: ''
  });

  const [flyerFile, setFlyerFile] = useState(null);
  const [proposalFile, setProposalFile] = useState(null);
  const [finalDocumentFile, setFinalDocumentFile] = useState(null);

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
                formFields: [],
                completionComment: ''
            });
        } else {
            setFormData({ 
                name: '', type: 'Training', structure: 'One-Time', description: '', 
                date: '', frequency: '', customSuffix: '', cost: 0, 
                venue: '', participantsCount: '', formFields: [], completionComment: ''
            });
        }
        setFlyerFile(null);
        setProposalFile(null);
        setFinalDocumentFile(null);
        setStep(1);
    }
  }, [isOpen, parentProgram]);

  if (!isOpen) return null;

  const isArchiveMode = () => {
      if (!formData.date) return false;
      const year = new Date(formData.date).getFullYear();
      return year <= 2024;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, type) => {
      const file = e.target.files[0];
      if (type === 'flyer') setFlyerFile(file);
      if (type === 'proposal') setProposalFile(file);
      if (type === 'finalDocument') setFinalDocumentFile(file);
  };

  const handleNext = () => {
      if (step === 1 && isArchiveMode()) {
          setStep(3);
      } else {
          setStep(step + 1);
      }
  };

  const handleBack = () => {
      if (step === 3 && isArchiveMode()) {
          setStep(1);
      } else {
          setStep(step - 1);
      }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const data = new FormData();
      
      let activeDeptId = departmentId;
      if (parentProgram) activeDeptId = parentProgram.department?._id || parentProgram.department;
      
      if (!activeDeptId) {
          const user = JSON.parse(localStorage.getItem('user'));
          if (user?.departments?.length > 0) activeDeptId = user.departments[0]._id || user.departments[0];
      }

      if (!activeDeptId) {
          showToast("Error: Could not identify your Department.", "error");
          setLoading(false);
          return;
      }
      data.append('departmentId', activeDeptId);

      let finalName = formData.name;
      if (parentProgram && !finalName) {
          const suffix = formData.customSuffix || new Date(formData.date || Date.now()).toLocaleDateString();
          finalName = `${parentProgram.name} - ${suffix}`;
      }
      data.append('name', finalName);

      data.append('type', formData.type);
      data.append('date', formData.date);
      
      if (isArchiveMode()) {
          data.append('status', 'Completed');
          data.append('actualAttendance', formData.participantsCount);
          data.append('description', formData.description);
          if (formData.completionComment) data.append('completionComment', formData.completionComment);
          if (finalDocumentFile) data.append('finalDocument', finalDocumentFile);
          
          data.append('structure', 'One-Time');
          data.append('venue', 'Archived');
          data.append('cost', 0);

      } else {
          data.append('structure', formData.structure);
          data.append('description', formData.description);
          data.append('cost', formData.cost);
          data.append('venue', formData.venue); 
          data.append('participantsCount', formData.participantsCount);
          
          if (formData.frequency) data.append('frequency', formData.frequency);
          if (formData.customSuffix) data.append('customSuffix', formData.customSuffix);
          if (formData.formFields.length > 0) data.append('formFields', JSON.stringify(formData.formFields));
          
          if (flyerFile) data.append('flyer', flyerFile);
          if (proposalFile) data.append('proposal', proposalFile);
      }

      if (parentProgram) data.append('parentId', parentProgram._id);

      await API.post('/programs', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });

      setLoading(false);
      showToast(isArchiveMode() ? "Program archived successfully!" : "Program created successfully!", "success");
      
      onSuccess(); 
      onClose();   

    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || "Failed to save program.", "error");
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
        
        <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Program Name</label>
            <input 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-emerald-500 font-bold text-gray-800 dark:text-white" 
                placeholder="e.g. Cybersecurity Bootcamp 2023" 
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Category</label>
                <select name="type" value={formData.type} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-emerald-500 text-gray-800 dark:text-gray-200">
                    <option value="Training">Training</option>
                    <option value="Event">Event</option>
                    <option value="Project">Project</option>
                    <option value="Pitch-IT">Pitch-IT</option>
                </select>
            </div>
            <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-emerald-500 text-gray-800 dark:text-gray-200" />
            </div>
        </div>

        {isArchiveMode() ? (
            <div className="space-y-4 pt-2 border-t border-dashed border-amber-200 dark:border-amber-800 animate-in fade-in">
                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-800 flex items-center gap-2 text-amber-800 dark:text-amber-400 text-xs font-bold">
                    <Archive size={16}/> Archive Mode Active: Recording Historical Data
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Impact (Total Beneficiaries)</label>
                        <input 
                            type="number" 
                            name="participantsCount" 
                            value={formData.participantsCount} 
                            onChange={handleChange} 
                            className="w-full p-3 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800 rounded-xl outline-none focus:border-amber-500 font-bold text-gray-800 dark:text-white" 
                            placeholder="Actual number of attendees" 
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl resize-none text-sm text-gray-800 dark:text-gray-200" placeholder="What was this program about?" />
                </div>

                <div className="relative group">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Report / Document (Optional)</label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all h-20 relative overflow-hidden">
                        {finalDocumentFile ? (
                            <div className="z-10 flex items-center gap-2">
                                <FileCheck size={20} className="text-amber-600"/>
                                <p className="text-xs text-gray-700 dark:text-gray-300 font-bold truncate max-w-[200px]">{finalDocumentFile.name}</p>
                            </div>
                        ) : (
                            <div className="z-10 flex items-center gap-2 text-gray-400 dark:text-gray-500">
                                <Upload size={18}/> <span className="text-xs">Upload Report (PDF/Doc)</span>
                            </div>
                        )}
                        <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => handleFileChange(e, 'finalDocument')} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Additional Info</label>
                    <textarea name="completionComment" value={formData.completionComment} onChange={handleChange} rows="2" className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl resize-none text-sm text-gray-800 dark:text-gray-200" placeholder="Any extra notes?" />
                </div>
            </div>
        ) : (
            <div className="space-y-4 pt-2 animate-in fade-in">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Venue</label>
                        <input name="venue" value={formData.venue} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-emerald-500 text-sm text-gray-800 dark:text-gray-200" placeholder="Location" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Expected Guests</label>
                        <input type="number" name="participantsCount" value={formData.participantsCount} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-emerald-500 text-sm text-gray-800 dark:text-gray-200" placeholder="0" />
                    </div>
                </div>

                <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
                    <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-3 block">Structure</label>
                    <div className="grid grid-cols-3 gap-3">
                        {['One-Time', 'Recurring', 'Numerical'].map((opt) => (
                            <button key={opt} onClick={() => setFormData({ ...formData, structure: opt })} className={`p-2 rounded-lg text-xs font-bold border transition-all flex flex-col items-center gap-1 ${formData.structure === opt ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'}`}>
                                {opt === 'One-Time' && <Calendar size={16}/>}
                                {opt === 'Recurring' && <Layers size={16}/>}
                                {opt === 'Numerical' && <Hash size={16}/>}
                                {opt}
                            </button>
                        ))}
                    </div>
                    {formData.structure === 'Recurring' && <input name="frequency" value={formData.frequency} onChange={handleChange} className="w-full p-2 mt-3 bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-gray-800 dark:text-gray-200" placeholder="Frequency (e.g. Weekly)" />}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="relative group">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Flyer</label>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl h-20 flex items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 relative">
                            {flyerFile ? <ImageIcon size={20} className="text-emerald-600"/> : <Upload size={20} className="text-gray-400 dark:text-gray-500"/>}
                            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'flyer')} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                    </div>
                    <div className="relative group">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Proposal</label>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl h-20 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 relative">
                            {proposalFile ? <FileText size={20} className="text-blue-600"/> : <Upload size={20} className="text-gray-400 dark:text-gray-500"/>}
                            <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => handleFileChange(e, 'proposal')} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl resize-none text-sm text-gray-800 dark:text-gray-200" placeholder="Brief overview..." />
                </div>
            </div>
        )}
    </div>
  );

  const renderStep2 = () => (
    <div className="animate-in slide-in-from-right-4 fade-in duration-300 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {parentProgram ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                <Layers className="text-gray-300 dark:text-gray-500 mb-4" size={48} />
                <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300">Form Inherited</h3>
                <p className="text-sm text-gray-400 mt-2">This version will use the Parent Program's registration form.</p>
            </div>
        ) : (
            <>
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Registration Form</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Define what applicants need to provide.</p>
                </div>
                <FormBuilder fields={formData.formFields} setFields={(newFields) => setFormData({ ...formData, formFields: newFields })} />
            </>
        )}
    </div>
  );

  const renderStep3 = () => {
    const isArchived = isArchiveMode();
    return (
        <div className="animate-in slide-in-from-right-4 fade-in duration-300 space-y-6 text-center py-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isArchived ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                {isArchived ? <Archive size={40} /> : <CheckCircle size={40} />}
            </div>
            <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {isArchived ? 'Archive Program?' : 'Ready to Launch?'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mt-2">
                    {isArchived 
                        ? "This will be saved as 'Completed' and added to the department history."
                        : `You are about to launch "${formData.name}".`
                    }
                </p>
            </div>
            <div className="flex justify-center gap-4 text-xs font-bold text-gray-400 dark:text-gray-500">
                {flyerFile && <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><CheckCircle size={12}/> Flyer Attached</span>}
                {proposalFile && <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400"><CheckCircle size={12}/> Proposal Attached</span>}
                {finalDocumentFile && <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400"><CheckCircle size={12}/> Report Attached</span>}
            </div>
        </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* ✅ Dark Mode Modal Container */}
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 dark:border-gray-800 transition-colors duration-300">
        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
            <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{parentProgram ? 'New Version' : (isArchiveMode() ? 'Archive Program' : 'Create Program')}</h2>
                <div className="flex gap-2 mt-2">
                    {(isArchiveMode() ? [1, 2] : [1, 2, 3]).map(i => {
                        const isActive = isArchiveMode() ? (step === 1 ? i === 1 : i <= 2) : step >= i;
                        return <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${isActive ? (isArchiveMode() ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-gray-200 dark:bg-gray-700'}`}></div>;
                    })}
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"><X size={20} className="text-gray-500 dark:text-gray-400"/></button>
        </div>

        <div className="p-8 overflow-y-auto flex-1">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
            {step > 1 ? (
                <button onClick={handleBack} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-bold text-sm px-4 py-2">
                    <ArrowLeft size={16}/> Back
                </button>
            ) : <div></div>}

            {step < 3 ? (
                <button 
                    onClick={handleNext} 
                    disabled={!formData.name || !formData.date}
                    className={`text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 transition-all shadow-lg ${isArchiveMode() ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200/50 dark:shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200/50 dark:shadow-none'}`}
                >
                    {isArchiveMode() ? 'Review & Save' : 'Next Step'} <ArrowRight size={16}/>
                </button>
            ) : (
                <button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className={`text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all ${isArchiveMode() ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200/50 dark:shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200/50 dark:shadow-none'}`}
                >
                    {loading ? <><Loader2 className="animate-spin" size={18}/> Processing...</> : (isArchiveMode() ? 'Archive Now' : 'Launch Program')}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default AddProgramModal;