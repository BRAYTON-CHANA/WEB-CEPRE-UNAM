import { Navigate } from 'react-router-dom';
import { tokenUtils } from '@/shared/utils/tokenUtils';

const ProtectedRoute = ({ children }) => {
  const token = tokenUtils.getToken();

  if (!tokenUtils.isTokenValid(token)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
