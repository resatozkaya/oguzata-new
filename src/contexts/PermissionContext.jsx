import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

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
    if (userRole === 'YÖNETİM') {
      return true;
    }

    // Diğer roller için normal yetki kontrolü
    return permissions.includes(permission);
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
