import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';

const PermissionContext = createContext();

export const usePermission = () => {
  return useContext(PermissionContext);
};

export const PermissionProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserPermissions = async () => {
      if (!currentUser) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        // Firestore'dan kullanıcı bilgilerini al
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.data();
        const userRoles = userData?.roles || [];

        // Temel izinler
        const defaultPermissions = [
          'VIEW_DASHBOARD',
          'VIEW_PROFILE',
          'VIEW_SETTINGS'
        ];

        // YÖNETİM rolü için ek izinler
        const adminPermissions = [
          'MANAGE_USERS',
          'MANAGE_ROLES',
          'MANAGE_PERMISSIONS',
          'EDIT_BINA_YAPISI',
          'MANAGE_SANTIYE',
          'CREATE_SANTIYE',
          'EDIT_SANTIYE',
          'DELETE_SANTIYE',
          'MANAGE_PERSONEL',
          'CREATE_PERSONEL',
          'EDIT_PERSONEL',
          'DELETE_PERSONEL',
          'MANAGE_PUANTAJ',
          'CREATE_PUANTAJ',
          'EDIT_PUANTAJ',
          'DELETE_PUANTAJ',
          'MANAGE_DEPO',
          'CREATE_DEPO',
          'EDIT_DEPO',
          'DELETE_DEPO',
          'MANAGE_RAPOR',
          'CREATE_RAPOR',
          'EDIT_RAPOR',
          'DELETE_RAPOR'
        ];

        let userPermissions = [...defaultPermissions];

        // Rol bazlı izinleri ekle
        if (userRoles.includes('YÖNETİM')) {
          userPermissions = [...userPermissions, ...adminPermissions];
        }

        // Firestore'dan özel izinleri ekle
        const customPermissions = userData?.permissions || [];
        userPermissions = [...userPermissions, ...customPermissions];

        // Yetkileri benzersiz yap ve kaydet
        setPermissions([...new Set(userPermissions)]);
      } catch (error) {
        console.error('Yetki yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserPermissions();
  }, [currentUser]);

  const hasPermission = (permission) => {
    // YÖNETİM rolü her zaman tüm yetkilere sahip
    if (currentUser?.roles?.includes('YÖNETİM')) {
      return true;
    }
    return permissions.includes(permission);
  };

  const value = {
    permissions,
    hasPermission,
    loading
  };

  if (loading) {
    return null; // veya loading spinner
  }

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export default PermissionProvider;
