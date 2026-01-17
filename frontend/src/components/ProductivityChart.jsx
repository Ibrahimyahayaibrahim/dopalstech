import { useState } from 'react';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

const ProductivityChart = ({ data, timeFrame, setTimeFrame, TooltipComponent }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col justify-between items-start mb-4 gap-2 pr-8">
        <div>
          <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600"><Activity size={16}/></div>
            Productivity
          </h4>
        </div>
        
        <div className="flex bg-gray-50 rounded-lg shadow-sm p-1 border border-gray-100 w-full">
          {['1W', '1M', '1Y'].map((tf) => (
            <button key={tf} onClick={() => setTimeFrame(tf)} className={`flex-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${timeFrame === tf ? 'bg-white text-emerald-600 shadow' : 'text-gray-400'}`}>
              {tf}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="prodGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} dy={5} />
            <Tooltip content={TooltipComponent} />
            <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#prodGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProductivityChart;