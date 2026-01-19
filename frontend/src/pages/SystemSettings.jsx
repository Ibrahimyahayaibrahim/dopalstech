import { useState, useRef } from 'react';
import API from '../services/api';
import { 
  User, Lock, Shield, Save, Camera, Loader2, Key
} from 'lucide-react';

// --- CONFIGURATION ---
const BACKEND_URL = "http://localhost:5000"; 

// --- HELPER: GET IMAGE URL (With Cache Buster) ---
const getProfileImage = (path) => {
    if (!path) return null;
    if (path.startsWith('blob:')) return path; // Local preview
    if (path.startsWith('http')) return path;  // External link
    // Append timestamp to force reload if it's a server path
    return `${BACKEND_URL}${path}`; 
};

const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [imageHash, setImageHash] = useState(Date.now()); // State to force re-render of image
  
  // Initialize user from LocalStorage
  const [user, setUser] = useState(() => {
      try { return JSON.parse(localStorage.getItem('user')) || {}; } catch (e) { return {}; }
  });
  
  const [profileData, setProfileData] = useState({
      name: user.name || '',
      email: user.email || '',
      position: user.position || ''
  });

  const [passData, setPassData] = useState({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
  });

  const fileInputRef = useRef(null);

  // --- 1. HANDLE PROFILE UPDATE ---
  const handleProfileUpdate = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
          const { data } = await API.put('/users/profile', profileData);
          const updatedUser = { ...user, ...data };
          
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          window.dispatchEvent(new Event('storage')); // Notify other components
          
          alert("Profile updated successfully!");
      } catch (err) {
          alert(err.response?.data?.message || "Failed to update profile.");
      } finally {
          setLoading(false);
      }
  };

  // --- 2. HANDLE AVATAR UPLOAD (FIXED) ---
  const handleImageUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const formData = new FormData();
      formData.append('profilePicture', file); // ✅ Must match upload.single('profilePicture')
      try {
          // ✅ FIX: Changed from API.post to API.put AND fixed the URL path
          const { data } = await API.put('/users/profile/image', formData, { 
              headers: { 'Content-Type': 'multipart/form-data'}
          });
          
          const updatedUser = { ...user, profilePicture: data.profilePicture };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          
          // Force visual update by updating hash
          setImageHash(Date.now());
          window.dispatchEvent(new Event('storage')); 
          
          // Optional: Success message
          // alert("Avatar updated successfully!"); 
          
      } catch (err) {
          console.error(err);
          alert("Failed to upload image");
      }
  };

  // --- 3. HANDLE PASSWORD CHANGE ---
  const handlePasswordChange = async (e) => {
      e.preventDefault();
      if (passData.newPassword !== passData.confirmPassword) {
          return alert("New passwords do not match!");
      }
      setLoading(true);
      try {
          await API.put('/users/password', {
              currentPassword: passData.currentPassword,
              newPassword: passData.newPassword
          });
          alert("Password changed successfully!");
          setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } catch (err) {
          alert(err.response?.data?.message || "Failed to change password");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 animate-enter pb-20">
      
      <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-800">System Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your account preferences and security.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
          
          <div className="w-full lg:w-64 flex-shrink-0 space-y-2">
              <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={18}/>} label="My Profile" />
              <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<Lock size={18}/>} label="Security" />
              {user.role === 'SUPER_ADMIN' && (
                  <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<Shield size={18}/>} label="Audit Logs" />
              )}
          </div>

          <div className="flex-1">
              
              {activeTab === 'profile' && (
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 animate-enter">
                      <h3 className="text-xl font-bold text-gray-800 mb-6">Public Profile</h3>
                      
                      <div className="flex items-center gap-6 mb-8">
                          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                              <div className="w-24 h-24 rounded-full border-4 border-emerald-50 bg-emerald-100 flex items-center justify-center text-3xl font-bold text-emerald-600 overflow-hidden">
                                  {user.profilePicture ? 
                                    // Append imageHash to bust cache
                                    <img src={`${getProfileImage(user.profilePicture)}?t=${imageHash}`} className="w-full h-full object-cover" alt="Profile" /> 
                                    : user.name?.[0]
                                  }
                              </div>
                              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                                  <Camera size={24}/>
                              </div>
                              <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                          </div>
                          <div>
                              <button onClick={() => fileInputRef.current.click()} className="text-sm font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors">Change Avatar</button>
                              <p className="text-xs text-gray-400 mt-2">JPG, GIF or PNG. Max size of 2MB</p>
                          </div>
                      </div>

                      <form onSubmit={handleProfileUpdate} className="space-y-5 max-w-lg">
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Full Name</label>
                                  <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-700 outline-none focus:border-emerald-500"
                                      value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Role</label>
                                  <input disabled className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl font-bold text-gray-500 cursor-not-allowed"
                                      value={user.role?.replace('_', ' ')} />
                              </div>
                          </div>
                          
                          {/* EMAIL: Enabled */}
                          <div>
                              <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Email Address</label>
                              <input 
                                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-700 outline-none focus:border-emerald-500"
                                  value={profileData.email} 
                                  onChange={e => setProfileData({...profileData, email: e.target.value})}
                              />
                          </div>

                          {/* JOB TITLE: Disabled */}
                          <div>
                              <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Job Title</label>
                              <input 
                                  disabled
                                  className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl font-medium text-gray-500 cursor-not-allowed"
                                  value={profileData.position} 
                              />
                          </div>

                          <div className="pt-4">
                              <button disabled={loading} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2">
                                  {loading ? <Loader2 className="animate-spin"/> : <><Save size={18}/> Save Changes</>}
                              </button>
                          </div>
                      </form>
                  </div>
              )}

              {activeTab === 'security' && (
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 animate-enter">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">Password & Security</h3>
                      <p className="text-sm text-gray-500 mb-8">Manage your password to keep your account safe.</p>

                      <form onSubmit={handlePasswordChange} className="max-w-lg space-y-5">
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-400 uppercase">Current Password</label>
                              <div className="relative">
                                  <Key size={18} className="absolute left-3 top-3 text-gray-400"/>
                                  <input type="password" required className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500"
                                      value={passData.currentPassword} onChange={e => setPassData({...passData, currentPassword: e.target.value})} />
                              </div>
                          </div>
                          
                          <div className="h-px bg-gray-100 my-4"></div>

                          <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-400 uppercase">New Password</label>
                              <div className="relative">
                                  <Lock size={18} className="absolute left-3 top-3 text-gray-400"/>
                                  <input type="password" required className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500"
                                      value={passData.newPassword} onChange={e => setPassData({...passData, newPassword: e.target.value})} />
                              </div>
                          </div>

                          <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-400 uppercase">Confirm New Password</label>
                              <div className="relative">
                                  <Lock size={18} className="absolute left-3 top-3 text-gray-400"/>
                                  <input type="password" required className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500"
                                      value={passData.confirmPassword} onChange={e => setPassData({...passData, confirmPassword: e.target.value})} />
                              </div>
                          </div>

                          <div className="pt-4">
                              <button disabled={loading} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2">
                                  {loading ? <Loader2 className="animate-spin"/> : 'Update Password'}
                              </button>
                          </div>
                      </form>
                  </div>
              )}

              {activeTab === 'logs' && user.role === 'SUPER_ADMIN' && (
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 animate-enter">
                      <h3 className="text-xl font-bold text-gray-800 mb-6">System Audit Logs</h3>
                      
                      <div className="border border-gray-100 rounded-2xl overflow-hidden">
                          <table className="w-full text-left text-sm">
                              <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-xs">
                                  <tr>
                                      <th className="p-4">Action</th>
                                      <th className="p-4">User</th>
                                      <th className="p-4">Date</th>
                                      <th className="p-4 text-right">Status</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                  <LogItem action="System Login" user={user.name} date="Just now" status="Success" />
                                  <LogItem action="Broadcast Sent" user={user.name} date="2 mins ago" status="Success" />
                                  <LogItem action="Profile Update" user={user.name} date="1 hour ago" status="Success" />
                              </tbody>
                          </table>
                      </div>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all font-bold text-sm text-left ${active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white text-gray-500 hover:bg-gray-50 border border-transparent hover:border-gray-100'}`}
    >
        {icon} {label}
    </button>
);

const LogItem = ({ action, user, date, status }) => (
    <tr className="hover:bg-gray-50/50">
        <td className="p-4 font-bold text-gray-700">{action}</td>
        <td className="p-4 text-gray-500">{user}</td>
        <td className="p-4 text-gray-400">{date}</td>
        <td className="p-4 text-right">
            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${status === 'Success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {status}
            </span>
        </td>
    </tr>
);

export default SystemSettings;