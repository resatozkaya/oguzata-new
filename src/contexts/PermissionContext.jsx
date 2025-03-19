import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth } from '../config/firebase';
import { getUserPermissions, getUserRoles } from '../services/roles';

const PermissionContext = createContext();

export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermission hook must be used within a PermissionProvider');
  }
  return context;
};

export const PermissionProvider = ({ children }) => {
  const [userPermissions, setUserPermissions] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (user) {
          const permissions = await getUserPermissions(user.uid);
          const roles = await getUserRoles(user.uid);
          setUserPermissions(permissions);
          setUserRoles(roles);
        }
      } catch (error) {
        console.error('Error loading permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, []);

  const hasPermission = useCallback((permission) => {
    // Eğer kullanıcı YÖNETİM rolündeyse tüm yetkilere sahip olsun
    if (userRoles?.includes('YONETIM')) {
      return true;
    }

    // Diğer roller için normal yetki kontrolü
    return userPermissions?.includes(permission) || false;
  }, [userRoles, userPermissions]);

  const value = {
    hasPermission,
    loading,
    userPermissions,
    userRoles
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export default PermissionContext;
