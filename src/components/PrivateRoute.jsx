import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  return children;
  
  // Eski kontroller:
  /*
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <CircularProgress />;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
  */
};

export default PrivateRoute;
