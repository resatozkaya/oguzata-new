import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const PermissionContext = createContext();

export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  return context;
};

export const PermissionProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [userPermissions, setUserPermissions] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      setUserPermissions(currentUser.permissions || []);
      setUserRoles(currentUser.roles || []);
    } else {
      setUserPermissions([]);
      setUserRoles([]);
    }
    setLoading(false);
  }, [currentUser]);

  const hasPermission = (permission) => {
    // Eğer kullanıcı YÖNETİM rolündeyse tüm yetkilere sahip olsun
    if (userRoles?.includes('YÖNETİM')) {
      return true;
    }

    // Diğer roller için normal yetki kontrolü
    return userPermissions?.includes(permission) || false;
  };

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

export default PermissionProvider;
