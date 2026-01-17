import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CompleteProfileModal from '../components/CompleteProfileModal'; // ✅ Correct path

const CompleteProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

  const handleUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // Once updated, the ProtectedRoute will allow access to Dashboard
    navigate('/dashboard'); 
  };

  const handleClose = () => {
     if (user?.isProfileComplete) {
         navigate('/dashboard');
     }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 pointer-events-none" />
      
      {/* ✅ Renders your existing component */}
      <CompleteProfileModal 
        user={user} 
        onClose={handleClose} 
        onUpdate={handleUpdate} 
      />
    </div>
  );
};

export default CompleteProfilePage;