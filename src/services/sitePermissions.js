import { collection, doc, getDocs, addDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

// Şantiye bazlı yetki atama
export const assignSitePermission = async (userId, siteId, permissions) => {
  try {
    // Önce mevcut yetkileri kontrol et
    const existingPermissions = await getUserSitePermissions(userId, siteId);
    
    // Eğer yetki varsa güncelle
    if (existingPermissions && existingPermissions.length > 0) {
      const permissionDoc = doc(db, 'site_permissions', existingPermissions[0].id);
      await deleteDoc(permissionDoc);
    }
    
    // Yeni yetki ekle
    const sitePermissionData = {
      userId,
      siteId,
      permissions,
      createdAt: new Date().toISOString()
    };
    
    await addDoc(collection(db, 'site_permissions'), sitePermissionData);
  } catch (error) {
    console.error('Şantiye yetkisi atanırken hata:', error);
    throw error;
  }
};

// Şantiye yetkilerini kaldırma
export const removeSitePermission = async (permissionId) => {
  try {
    await deleteDoc(doc(db, 'site_permissions', permissionId));
  } catch (error) {
    console.error('Şantiye yetkisi kaldırılırken hata:', error);
    throw error;
  }
};

// Kullanıcının şantiye yetkilerini getirme
export const getUserSitePermissions = async (userId, siteId) => {
  try {
    const q = query(
      collection(db, 'site_permissions'),
      where('userId', '==', userId),
      where('siteId', '==', siteId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Kullanıcı şantiye yetkileri getirilirken hata:', error);
    throw error;
  }
};

// Şantiyenin tüm yetkili kullanıcılarını getirme
export const getSitePermissionUsers = async (siteId) => {
  try {
    const q = query(
      collection(db, 'site_permissions'),
      where('siteId', '==', siteId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Şantiye yetkili kullanıcıları getirilirken hata:', error);
    throw error;
  }
};
