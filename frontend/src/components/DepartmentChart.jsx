import { useState } from 'react';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Sector } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// ✅ 1. Import Theme Context
import { useTheme } from '../context/ThemeContext';

const DepartmentChart = ({ data, colors }) => {
  const navigate = useNavigate();
  const { theme } = useTheme(); // ✅ 2. Get current theme (light/dark)
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const onPieClick = (data) => {
    if (data && data.payload && data.payload._id) {
        navigate(`/departments/${data.payload._id}`);
    }
  };

  // ✅ 3. MOVED INSIDE: This function must be inside to see the 'theme' variable
  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
    
    // ✅ 4. LOGIC: If Dark Mode, use White Text. Else, use Dark Gray.
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const titleColor = isDark ? "#F3F4F6" : "#374151"; // White vs Dark Gray
    const subTextColor = isDark ? "#9CA3AF" : "#6B7280"; // Light Gray vs Gray

    return (
      <g>
        {/* Center Title */}
        <text 
          x={cx} 
          y={cy} 
          dy={-10} 
          textAnchor="middle" 
          fill={titleColor} // 👈 Applies dynamic color
          className="text-xl font-bold"
          dominantBaseline="middle"
        >
          {payload.name}
        </text>
        
        {/* Percentage */}
        <text 
          x={cx} 
          y={cy} 
          dy={15} 
          textAnchor="middle" 
          fill={subTextColor} // 👈 Applies dynamic color
          className="text-sm font-medium"
          dominantBaseline="middle"
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
        
        {/* Highlighted Slice */}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        
        {/* Outer Ring */}
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 12}
          outerRadius={outerRadius + 14}
          fill={fill}
          fillOpacity={0.6}
        />
      </g>
    );
  };

  if (!data || data.length === 0) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
              <PieIcon size={40} className="mb-2 opacity-20"/>
              <p className="text-xs font-bold uppercase tracking-widest">No Data Available</p>
          </div>
      );
  }

  return (
    <div className="h-full flex flex-col w-full relative">
      {/* ✅ 5. Title color update for Dark Mode */}
      <h4 className="font-bold text-gray-800 dark:text-white text-lg flex items-center gap-2 mb-2 px-4 pt-2 shrink-0 transition-colors">
        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
            <PieIcon size={18}/>
        </div>
        Departments
      </h4>
      
      <div className="flex-1 w-full min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie 
              activeIndex={activeIndex}
              activeShape={renderActiveShape} 
              data={data} 
              cx="50%" 
              cy="50%" 
              innerRadius={60} 
              outerRadius={80} 
              paddingAngle={5} 
              dataKey="value" 
              onMouseEnter={onPieEnter}
              onClick={onPieClick}
              className="cursor-pointer focus:outline-none"
            >
              {data.map((entry, index) => (
                <Cell 
                    key={`cell-${index}`} 
                    fill={colors[index % colors.length]} 
                    stroke="none" 
                    className="transition-all duration-300 hover:opacity-80"
                />
              ))}
            </Pie>
            <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
                iconType="circle" 
                wrapperStyle={{ 
                    width: '100%',
                    bottom: 0,
                    left: 0,
                    fontSize: '10px', 
                    paddingTop: '10px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '10px'
                }}
                // ✅ 6. Legend text color update
                formatter={(value) => <span className="text-slate-500 dark:text-slate-400 font-bold ml-1">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DepartmentChart;