import { useAuth } from '../contexts/AuthContext';

export const usePermission = () => {
  const { currentUser } = useAuth();

  const hasPermission = (permission) => {
    console.log('Checking permission:', permission);
    console.log('Current user:', currentUser);
    console.log('User role:', currentUser?.role);
    console.log('User permissions:', currentUser?.permissions);

    if (!currentUser) {
      console.log('No user logged in');
      return false;
    }

    // YÖNETİM rolü tüm yetkilere sahip
    if (currentUser.role === 'YÖNETİM') {
      console.log('User has YÖNETİM role, granting all permissions');
      return true;
    }

    const hasRequiredPermission = currentUser.permissions?.includes(permission);
    console.log('Has required permission:', hasRequiredPermission);
    return hasRequiredPermission;
  };

  return hasPermission;
};
