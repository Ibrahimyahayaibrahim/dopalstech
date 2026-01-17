import { useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

const ExpandableChartCard = ({ children, className = "" }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className={`
        bg-white border border-gray-100 transition-all duration-500 ease-in-out
        ${isExpanded 
            ? 'fixed inset-0 z-50 p-8 rounded-none overflow-auto' 
            : `relative rounded-[2rem] p-6 md:p-8 shadow-sm h-full ${className}`
        }
      `}
    >
      {/* Maximize/Minimize Button */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute top-6 right-6 p-2 bg-gray-50 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors z-20 group"
        title={isExpanded ? "Minimize" : "Maximize view"}
      >
        {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
      </button>

      {/* Content Container */}
      <div className="w-full h-full flex flex-col">
        {children}
      </div>

      {/* Backdrop for Full Screen Mode (Optional aesthetic touch) */}
      {isExpanded && (
        <div className="fixed inset-0 bg-white/50 -z-10 backdrop-blur-sm pointer-events-none"></div>
      )}
    </div>
  );
};

export default ExpandableChartCard;