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
          const role = userData.role; // Kullanıcının rolünü al
          
          console.log('User Role:', role); // Debug için
          console.log('Loaded permissions:', userPermissions); // Debug için
          
          setUserRole(role);
          setPermissions(userPermissions);
        } else {
          console.log('User document not found'); // Debug için
          setPermissions([]);
          setUserRole(null);
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

    // Önce kullanıcının veritabanındaki permissions dizisini kontrol et
    if (permissions.includes(permission)) {
      return true;
    }

    // Eğer permissions dizisinde yoksa, role göre kontrol et
    const rolePermissions = {
      [ROLES.MUHASEBE]: [
        // Anasayfa yetkileri
        'dashboard_view',
        // Masraf muhasebe yetkisi
        PAGE_PERMISSIONS.MASRAF_BEYAN.MUHASEBE,
        // Mesajlaşma yetkileri
        PAGE_PERMISSIONS.MESAJLASMA.VIEW,
        PAGE_PERMISSIONS.MESAJLASMA.SEND,
        PAGE_PERMISSIONS.MESAJLASMA.DELETE,
        PAGE_PERMISSIONS.MESAJLASMA.MANAGE,
        // Ayarlar yetkileri
        PAGE_PERMISSIONS.AYARLAR.VIEW,
        PAGE_PERMISSIONS.AYARLAR.UPDATE,
        PAGE_PERMISSIONS.AYARLAR.MANAGE,
      ],
      [ROLES.PERSONEL]: [
        'dashboard_view',
        ...Object.values(PAGE_PERMISSIONS).map(module => module.VIEW),
        PAGE_PERMISSIONS.MESAJLASMA.SEND,
        PAGE_PERMISSIONS.AYARLAR.VIEW,
      ],
      [ROLES.SANTIYE_SEFI]: [
        'dashboard_view',
        ...Object.values(PAGE_PERMISSIONS.SANTIYE),
        ...Object.values(PAGE_PERMISSIONS.PERSONEL),
        ...Object.values(PAGE_PERMISSIONS.PUANTAJ),
        ...Object.values(PAGE_PERMISSIONS.DEPO),
        ...Object.values(PAGE_PERMISSIONS.GUNLUK_RAPOR),
        ...Object.values(PAGE_PERMISSIONS.MESAJLASMA),
        PAGE_PERMISSIONS.TESLIMAT.VIEW,
        PAGE_PERMISSIONS.TESLIMAT.CREATE,
        PAGE_PERMISSIONS.MASRAF_BEYAN.VIEW,
        PAGE_PERMISSIONS.MASRAF_BEYAN.CREATE,
        PAGE_PERMISSIONS.AYARLAR.VIEW,
      ],
    };

    // Rol için tanımlı yetkiler varsa kontrol et
    if (userRole && rolePermissions[userRole]) {
      return rolePermissions[userRole].includes(permission);
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
