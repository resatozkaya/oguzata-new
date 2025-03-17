import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

// Rol izinlerini getir
export const getRolePermissions = async (userId) => {
  try {
    // Önce kullanıcının rolünü al
    const usersRef = collection(db, 'users');
    const userQuery = query(usersRef, where('uid', '==', userId));
    const userSnapshot = await getDocs(userQuery);
    
    if (userSnapshot.empty) {
      console.error('Kullanıcı bulunamadı:', userId);
      return [];
    }

    const userRole = userSnapshot.docs[0].data().role;
    
    // Rol izinlerini getir
    const rolePermissionsRef = collection(db, 'rolePermissions');
    const roleQuery = query(rolePermissionsRef, where('role', '==', userRole));
    const roleSnapshot = await getDocs(roleQuery);
    
    if (!roleSnapshot.empty) {
      const doc = roleSnapshot.docs[0];
      return doc.data().permissions || [];
    }
    
    return [];
  } catch (error) {
    console.error('Rol izinleri alınırken hata:', error);
    return [];
  }
};

// Tüm rolleri getir
export const getAllRoles = async () => {
  try {
    const rolesRef = collection(db, 'roles');
    const querySnapshot = await getDocs(rolesRef);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Roller alınırken hata:', error);
    return [];
  }
};

// Kullanıcı rolünü getir
export const getUserRole = async (userId) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return doc.data().role;
    }
    
    return null;
  } catch (error) {
    console.error('Kullanıcı rolü alınırken hata:', error);
    return null;
  }
};
