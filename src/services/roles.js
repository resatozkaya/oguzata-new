import { db } from '../config/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc
} from 'firebase/firestore';

// Kullanıcının rollerini getir
export const getUserRoles = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().roles || [];
    }
    return [];
  } catch (error) {
    console.error('Error getting user roles:', error);
    return [];
  }
};

// Kullanıcının yetkilerini getir
export const getUserPermissions = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().permissions || [];
    }
    return [];
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
};

// Rolleri getir
export const getRoles = async (santiyeId, isTeslimatEkip = false) => {
  try {
    if (isTeslimatEkip) {
      // Teslimat ekip kullanıcılarını getir
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        displayName: doc.data().displayName,
        email: doc.data().email,
        permissions: doc.data().permissions || []
      }));
    } else {
      // Şantiye rollerini getir
      const rolesRef = collection(db, 'roles');
      const q = query(rolesRef, where('santiyeId', '==', santiyeId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }
  } catch (error) {
    console.error('Error getting roles:', error);
    throw error;
  }
};

// Rol yetkilerini güncelle
export const updateRolePermissions = async (userId, permissions, isTeslimatEkip = false) => {
  try {
    if (isTeslimatEkip) {
      // Teslimat ekip kullanıcı yetkilerini güncelle
      const userDoc = doc(db, 'users', userId);
      await updateDoc(userDoc, { permissions });
    } else {
      // Şantiye rol yetkilerini güncelle
      const roleDoc = doc(db, 'roles', userId);
      await updateDoc(roleDoc, { permissions });
    }
    return true;
  } catch (error) {
    console.error('Error updating permissions:', error);
    return false;
  }
};
