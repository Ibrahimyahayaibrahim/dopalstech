import React from 'react';
import logo from '../assets/logo.png'; 

const Loader = ({ text = "Loading..." }) => {
  return (
    // Increased opacity (bg-white/95) to block out background noise completely
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm transition-all">
      
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
        
        {/* 1. Outer Static Track (Very thin, subtle) */}
        <div className="absolute w-20 h-20 border-[3px] border-slate-100 rounded-full"></div>
        
        {/* 2. Active Spinning Ring (Thin, Emerald) */}
        <div className="absolute w-20 h-20 border-[3px] border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        
        {/* 3. Logo Container (Smaller size) */}
        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center relative z-10 shadow-sm animate-breathe">
             <img 
               src={logo} 
               alt="Dopals" 
               className="w-7 h-7 object-contain" 
             />
        </div>
      </div>

      {/* 4. Minimal Text */}
      <div className="flex flex-col items-center gap-1">
         <h3 className="text-sm font-black text-slate-800 tracking-wide">
            Dopals Tech
         </h3>
         <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] animate-pulse">
            {text}
         </p>
      </div>

    </div>
  );
};

export default Loader;