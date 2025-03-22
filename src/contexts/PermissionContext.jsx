import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { PAGE_PERMISSIONS } from '../constants/permissions';
import { USER_ROLES } from '../constants/roles';

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
        let userPermissions = [];

        // YÖNETİM rolü için tüm izinler
        if (userRoles.includes('YÖNETİM') || userData?.role === 'YÖNETİM') {
          userPermissions = Object.values(PAGE_PERMISSIONS).reduce((acc, module) => {
            return [...acc, ...Object.values(module)];
          }, []);
        } else {
          // Firestore'dan özel izinleri al
          const customPermissions = userData?.permissions || [];
          userPermissions = [...customPermissions];

          // Eğer eksiklik_manage yetkisi varsa, tüm eksiklik yetkilerini ekle
          if (customPermissions.includes('eksiklik_manage')) {
            Object.values(PAGE_PERMISSIONS.EKSIKLIK).forEach(permission => {
              if (!userPermissions.includes(permission)) {
                userPermissions.push(permission);
              }
            });
          }
        }

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
    if (!currentUser) {
      console.log('Kullanıcı oturumu bulunamadı');
      return false;
    }

    // Debug log
    console.log('Yetki kontrolü:', {
      permission,
      currentUser,
      role: currentUser.role,
      permissions: currentUser.permissions
    });

    // Yönetim rolüne sahip kullanıcılar için tüm yetkiler açık
    if (currentUser.role === 'YÖNETİM' || currentUser.role === USER_ROLES.ADMIN) {
      console.log('Yönetim rolü tespit edildi, tüm yetkiler açık');
      return true;
    }

    // Kullanıcının yetkilerini kontrol et
    const userPermissions = currentUser.permissions || [];
    const hasPermission = userPermissions.includes(permission);
    
    console.log(`Yetki kontrolü sonucu: ${permission}`, {
      userPermissions,
      hasPermission
    });

    return hasPermission;
  };

  const value = {
    permissions,
    hasPermission,
    currentUser,
    loading
  };

  if (loading) {
    console.log('Yetkiler yükleniyor...');
    return null; // veya loading spinner
  }

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export default PermissionProvider;
