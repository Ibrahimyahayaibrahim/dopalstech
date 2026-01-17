import { useState } from 'react';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Sector } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- 1. CLEAN ACTIVE SHAPE (No Glow) ---
const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
  return (
    <g>
      {/* Center Text - Centered vertically and horizontally */}
      <text 
        x={cx} 
        y={cy} 
        dy={-10} 
        textAnchor="middle" 
        fill="#374151" 
        className="text-xl font-bold"
        dominantBaseline="middle"
      >
        {payload.name}
      </text>
      <text 
        x={cx} 
        y={cy} 
        dy={15} 
        textAnchor="middle" 
        fill="#9ca3af" 
        className="text-sm font-medium"
        dominantBaseline="middle"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
      
      {/* The Main Expanded Slice - GLOW REMOVED */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8} // Expands outward
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        // Removed 'drop-shadow-lg' and 'filter blur-sm'
      />
      
      {/* The Outer Ring Effect */}
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 14}
        fill={fill}
      />
    </g>
  );
};

const DepartmentChart = ({ data, colors }) => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const onPieClick = (data) => {
    // Only navigate if we have a valid department ID
    if (data && data.payload && data.payload._id) {
        navigate(`/departments/${data.payload._id}`);
    }
  };

  return (
    <div className="h-full flex flex-col w-full relative">
      <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2 mb-2 px-4 pt-2 shrink-0">
        <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
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
                formatter={(value) => <span className="text-slate-500 font-bold ml-1">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DepartmentChart;