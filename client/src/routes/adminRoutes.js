import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminRoutes = ({ children }) => {
  const userType = localStorage.getItem('userType');
  const isAdmin = userType === 'admin' || userType === 'super_admin';
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      console.log('Non-admin user detected. Redirecting to homepage...');
      navigate('/', { replace: true }); 
    }
  }, [isAdmin, navigate]);

  return isAdmin ? children : null; 
};

export default AdminRoutes;