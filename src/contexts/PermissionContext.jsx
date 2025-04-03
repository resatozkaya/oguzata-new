import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ROLES, PAGE_PERMISSIONS, CRUD_PERMISSIONS } from '../constants/permissions';

const PermissionContext = createContext();

export const usePermission = () => {
  return useContext(PermissionContext);
};

export const PermissionProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const loadPermissions = async () => {
      if (!currentUser?.uid) {
        setPermissions([]);
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userPermissions = userData.permissions || [];
          const role = userData.role;
          
          console.log('User Role:', role);
          console.log('User Permissions:', userPermissions);
          
          setUserRole(role);
          setPermissions(userPermissions);
        }
      } catch (error) {
        console.error('Error loading permissions:', error);
        setPermissions([]);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [currentUser]);

  const hasPermission = (permission) => {
    // Debug için
    console.log('Checking permission:', permission);
    console.log('Current permissions:', permissions);
    console.log('User role:', userRole);
    
    // YÖNETİM rolü tüm yetkilere sahip
    if (userRole === ROLES.YONETIM) {
      return true;
    }

    // Anasayfa yetkisi - eğer kullanıcının herhangi bir rolü varsa anasayfayı görebilir
    if (permission === 'dashboard_view' && userRole) {
      return true;
    }

    // Kullanıcının yetkilerini kontrol et
    if (permissions.includes(permission)) {
      return true;
    }

    return false;
  };

  const value = {
    permissions,
    hasPermission,
    loading,
    userRole
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};
