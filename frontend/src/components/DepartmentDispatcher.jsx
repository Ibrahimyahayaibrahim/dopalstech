import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DepartmentDispatcher = () => {
  const navigate = useNavigate();
  // Safe retrieval of user object
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const userDepts = user.departments || [];

  useEffect(() => {
    // 1. ADMIN CHECK: Admins always see ALL departments
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
      navigate('/departments/all', { replace: true });
      return;
    }

    // 2. DEPARTMENT COUNT CHECK
    if (userDepts.length === 0) {
      // No access
      navigate('/departments/empty', { replace: true });
    } else if (userDepts.length === 1) {
      // SINGLE DEPARTMENT: Direct Access
      // Handle cases where departments are Objects ({_id: '...'}) or Strings ('...')
      const deptId = userDepts[0]._id || userDepts[0];
      navigate(`/departments/${deptId}`, { replace: true });
    } else {
      // MULTIPLE DEPARTMENTS: Show My List
      navigate('/departments/my', { replace: true });
    }
  }, [navigate, user.role, userDepts]);

  return null; // Logic only, no UI
};

export default DepartmentDispatcher;