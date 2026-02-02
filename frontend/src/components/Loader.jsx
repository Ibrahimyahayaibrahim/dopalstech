import React from 'react';
import logo from '../assets/logo.png'; 

const Loader = ({ text = "Loading..." }) => {
  return (
    // ✅ Dark Mode Background
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm transition-all duration-300">
      
      {/* Custom Animation: Subtle Breathing */}
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }
        .animate-breathe {
          animation: breathe 2s ease-in-out infinite;
        }
      `}</style>

      <div className="relative flex items-center justify-center mb-6">
        
        {/* 1. Outer Static Track */}
        <div className="absolute w-20 h-20 border-[3px] border-slate-100 dark:border-gray-800 rounded-full"></div>
        
        {/* 2. Active Spinning Ring */}
        <div className="absolute w-20 h-20 border-[3px] border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        
        {/* 3. Logo Container */}
        <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center relative z-10 shadow-sm dark:shadow-none animate-breathe">
             <img 
               src={logo} 
               alt="Dopals" 
               className="w-7 h-7 object-contain" 
             />
        </div>
      </div>

      {/* 4. Minimal Text */}
      <div className="flex flex-col items-center gap-1">
         <h3 className="text-sm font-black text-slate-800 dark:text-white tracking-wide">
            Dopals Tech
         </h3>
         <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] animate-pulse">
            {text}
         </p>
      </div>

    </div>
  );
};

export default Loader;