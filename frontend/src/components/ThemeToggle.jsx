import { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Monitor, Check, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper to get icon for current state
  const getCurrentIcon = () => {
    if (theme === 'dark') return <Moon size={20} />;
    if (theme === 'light') return <Sun size={20} />;
    return <Monitor size={20} />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* TRIGGER BUTTON */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-xl transition-all duration-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border border-transparent focus:border-emerald-500/50 outline-none"
        aria-label="Toggle Theme"
      >
        {getCurrentIcon()}
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}/>
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-1">
            <button 
              onClick={() => { setTheme('light'); setIsOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${theme === 'light' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <Sun size={16} /> Light
              {theme === 'light' && <Check size={14} className="ml-auto"/>}
            </button>

            <button 
              onClick={() => { setTheme('dark'); setIsOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <Moon size={16} /> Dark
              {theme === 'dark' && <Check size={14} className="ml-auto"/>}
            </button>

            <button 
              onClick={() => { setTheme('system'); setIsOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${theme === 'system' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <Monitor size={16} /> Auto
              {theme === 'system' && <Check size={14} className="ml-auto"/>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;