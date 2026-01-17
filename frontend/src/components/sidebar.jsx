import { useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="w-64 h-screen bg-blue-900 text-white flex flex-col fixed">
      <div className="p-6 text-2xl font-bold border-b border-blue-800">
        Dopals Admin
      </div>
      <nav className="flex-grow mt-6">
        <ul className="space-y-2 px-4">
          <li className="hover:bg-blue-800 p-3 rounded cursor-pointer transition">📊 Dashboard</li>
          <li className="hover:bg-blue-800 p-3 rounded cursor-pointer transition">🏢 Departments</li>
          <li className="hover:bg-blue-800 p-3 rounded cursor-pointer transition">👥 Staff Members</li>
          <li className="hover:bg-blue-800 p-3 rounded cursor-pointer transition">📅 Events</li>
        </ul>
      </nav>
      <div className="p-4 border-t border-blue-800">
        <button 
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 py-2 rounded font-bold transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;