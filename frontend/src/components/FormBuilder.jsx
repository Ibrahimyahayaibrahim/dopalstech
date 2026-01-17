import React, { useState } from 'react';
import { Plus, Trash2, List, Type, FileText, Calendar, CheckSquare } from 'lucide-react';

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text', icon: <Type size={14}/> },
  { value: 'textarea', label: 'Long Description', icon: <List size={14}/> },
  { value: 'number', label: 'Number', icon: <List size={14}/> },
  { value: 'date', label: 'Date Picker', icon: <Calendar size={14}/> },
  { value: 'select', label: 'Dropdown Selection', icon: <CheckSquare size={14}/> },
  { value: 'file', label: 'File Upload', icon: <FileText size={14}/> },
];

const FormBuilder = ({ fields, setFields }) => {
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState('text');
  const [newRequired, setNewRequired] = useState(false);
  const [newOptions, setNewOptions] = useState(''); // Comma separated for dropdowns

  const addField = () => {
    if (!newLabel.trim()) return;

    const field = {
      label: newLabel,
      fieldType: newType,
      required: newRequired,
      // Only parse options if it's a dropdown
      options: newType === 'select' ? newOptions.split(',').map(s => s.trim()).filter(Boolean) : []
    };

    setFields([...fields, field]);
    
    // Reset Form
    setNewLabel('');
    setNewType('text');
    setNewRequired(false);
    setNewOptions('');
  };

  const removeField = (index) => {
    const updated = fields.filter((_, i) => i !== index);
    setFields(updated);
  };

  return (
    <div className="space-y-6">
      
      {/* --- PREVIEW OF FIELDS --- */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Registration Form Preview</h4>
        
        {/* Standard Fields (Locked) */}
        <div className="p-3 bg-white border border-gray-200 rounded-lg opacity-60 flex justify-between items-center">
             <span className="text-sm font-bold text-gray-700">Full Name</span>
             <span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500">System Field</span>
        </div>
        <div className="p-3 bg-white border border-gray-200 rounded-lg opacity-60 flex justify-between items-center">
             <span className="text-sm font-bold text-gray-700">Email Address</span>
             <span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500">System Field</span>
        </div>

        {/* Custom Fields (Dynamic) */}
        {fields.map((field, idx) => (
          <div key={idx} className="p-3 bg-white border border-emerald-100 rounded-lg shadow-sm flex justify-between items-center group animate-in fade-in slide-in-from-bottom-2">
            <div>
              <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-800">{field.label}</span>
                  {field.required && <span className="text-red-500 text-xs">*</span>}
              </div>
              <p className="text-[10px] text-gray-400 uppercase flex items-center gap-1 mt-0.5">
                {FIELD_TYPES.find(t => t.value === field.fieldType)?.icon}
                {field.fieldType}
              </p>
            </div>
            <button 
                onClick={() => removeField(idx)}
                className="text-gray-300 hover:text-red-500 transition-colors p-2"
            >
                <Trash2 size={16} />
            </button>
          </div>
        ))}

        {fields.length === 0 && (
            <div className="text-center py-4 text-gray-400 text-sm italic">
                No custom questions yet. Add one below.
            </div>
        )}
      </div>

      {/* --- ADD NEW FIELD FORM --- */}
      <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-200">
        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Plus size={16} className="text-emerald-600"/> Add Custom Question
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Question Label</label>
                <input 
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="e.g. Years of Experience"
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-emerald-500 outline-none"
                />
            </div>
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Answer Type</label>
                <select 
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-emerald-500 outline-none bg-white"
                >
                    {FIELD_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                </select>
            </div>
        </div>

        {/* Dropdown Options Input (Conditional) */}
        {newType === 'select' && (
            <div className="mb-4 animate-in fade-in">
                <label className="text-xs font-bold text-gray-500 uppercase">Options (Comma Separated)</label>
                <input 
                    value={newOptions}
                    onChange={(e) => setNewOptions(e.target.value)}
                    placeholder="e.g. Male, Female, Other"
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-emerald-500 outline-none"
                />
            </div>
        )}

        <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
                <input 
                    type="checkbox" 
                    checked={newRequired} 
                    onChange={(e) => setNewRequired(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500" 
                />
                <span className="text-sm text-gray-600">Required Field</span>
            </label>

            <button 
                onClick={addField}
                disabled={!newLabel}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                Add Field
            </button>
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;