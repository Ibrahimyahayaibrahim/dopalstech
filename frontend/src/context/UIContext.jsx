import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UIContext = createContext();

export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }) => {
  // --- TOAST STATE ---
  const [toasts, setToasts] = useState([]);

  // --- CONFIRM MODAL STATE ---
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger', // danger | info
    onConfirm: () => {},
    onCancel: () => {},
  });

  // --- TOAST LOGIC ---
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000); // Auto close after 4s
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // --- CONFIRM LOGIC (Promise-based for await capability) ---
  const confirmAction = useCallback((message, title = "Are you sure?", options = {}) => {
    return new Promise((resolve) => {
      setConfirmModal({
        isOpen: true,
        message,
        title,
        confirmText: options.confirmText || 'Yes, Proceed',
        cancelText: options.cancelText || 'Cancel',
        type: options.type || 'danger',
        onConfirm: () => {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  }, []);

  return (
    <UIContext.Provider value={{ showToast, confirmAction }}>
      {children}
      
      {/* RENDER TOASTS */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>

      {/* RENDER CONFIRM MODAL */}
      <AnimatePresence>
        {confirmModal.isOpen && <ConfirmDialog {...confirmModal} />}
      </AnimatePresence>

    </UIContext.Provider>
  );
};

// --- SUB-COMPONENT: TOAST ---
const Toast = ({ message, type, onClose }) => {
  const styles = {
    success: { bg: 'bg-white', border: 'border-emerald-100', icon: <CheckCircle className="text-emerald-500" size={20}/>, title: 'Success' },
    error: { bg: 'bg-white', border: 'border-red-100', icon: <AlertCircle className="text-red-500" size={20}/>, title: 'Error' },
    info: { bg: 'bg-white', border: 'border-blue-100', icon: <Info className="text-blue-500" size={20}/>, title: 'Info' },
  };
  const style = styles[type] || styles.info;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50, scale: 0.9 }} 
      animate={{ opacity: 1, x: 0, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`pointer-events-auto min-w-[320px] max-w-sm p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border ${style.border} ${style.bg} flex items-start gap-3 backdrop-blur-md`}
    >
      <div className="mt-0.5">{style.icon}</div>
      <div className="flex-1">
        <h4 className={`text-sm font-bold capitalize ${type === 'error' ? 'text-red-600' : 'text-gray-800'}`}>{style.title}</h4>
        <p className="text-sm text-gray-500 leading-snug mt-0.5">{message}</p>
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16}/></button>
    </motion.div>
  );
};

// --- SUB-COMPONENT: CONFIRM DIALOG ---
const ConfirmDialog = ({ title, message, confirmText, cancelText, type, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCancel} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-6 relative z-10 border border-gray-100 overflow-hidden"
      >
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'}`}>
          {type === 'danger' ? <AlertTriangle size={32}/> : <Info size={32}/>}
        </div>
        
        <div className="text-center mb-8">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <p className="text-gray-500 mt-2 text-sm">{message}</p>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors">{cancelText}</button>
          <button onClick={onConfirm} className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${type === 'danger' ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}>
            {confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default UIContext;