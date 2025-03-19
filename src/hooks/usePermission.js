import { useAuth } from '../contexts/AuthContext';

export const usePermission = (requiredPermission) => {
  const { currentUser } = useAuth();

  if (!currentUser) return false;
  if (currentUser.role === 'YÖNETİM') return true;
  return currentUser.permissions?.includes(requiredPermission);
};
