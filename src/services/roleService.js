import { db } from '../config/firebase';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { PAGE_PERMISSIONS, ROLES } from '../constants/permissions';

const ROLES_COLLECTION = 'roles';
const USER_ROLES_COLLECTION = 'userRoles';
const USERS_COLLECTION = 'users';

export const roleService = {
  // Rolleri getir
  async getRoles() {
    const rolesSnapshot = await getDocs(collection(db, 'roles'));
    return rolesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      permissions: doc.data().permissions || []
    }));
  },

  // Rol oluştur
  async createRole(roleData) {
    const roleRef = doc(collection(db, 'roles'));
    await setDoc(roleRef, {
      ...roleData,
      permissions: roleData.permissions || []
    });
    return roleRef.id;
  },

  // Rol güncelle
  async updateRole(roleId, roleData) {
    const roleRef = doc(db, 'roles', roleId);
    await updateDoc(roleRef, {
      ...roleData,
      permissions: roleData.permissions || []
    });

    // Bu role sahip tüm kullanıcıların yetkilerini güncelle
    const usersSnapshot = await getDocs(
      query(collection(db, 'users'), where('role', '==', roleData.name))
    );

    const updatePromises = usersSnapshot.docs.map(userDoc => {
      return updateDoc(doc(db, 'users', userDoc.id), {
        permissions: roleData.permissions || []
      });
    });

    await Promise.all(updatePromises);
  },

  // Rol sil
  async deleteRole(roleId) {
    const roleRef = doc(db, 'roles', roleId);
    const roleDoc = await getDoc(roleRef);
    
    if (!roleDoc.exists()) {
      throw new Error('Rol bulunamadı');
    }

    const roleName = roleDoc.data().name;

    // Bu role sahip kullanıcıları bul
    const usersSnapshot = await getDocs(
      query(collection(db, 'users'), where('role', '==', roleName))
    );

    // Kullanıcıların rollerini ve yetkilerini temizle
    const updatePromises = usersSnapshot.docs.map(userDoc => {
      return updateDoc(doc(db, 'users', userDoc.id), {
        role: '',
        permissions: []
      });
    });

    await Promise.all(updatePromises);
    await deleteDoc(roleRef);
  },

  // Kullanıcıları rolleriyle birlikte getir
  async getUsersWithRoles() {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    return usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  // Kullanıcı rolünü güncelle
  async updateUserRole(userId, newRole) {
    const userRef = doc(db, 'users', userId);
    
    // Yeni rolün yetkilerini al
    const rolesSnapshot = await getDocs(
      query(collection(db, 'roles'), where('name', '==', newRole))
    );
    
    const roleDoc = rolesSnapshot.docs[0];
    const rolePermissions = roleDoc ? roleDoc.data().permissions : [];

    // Kullanıcıyı güncelle
    await updateDoc(userRef, {
      role: newRole,
      permissions: rolePermissions
    });
  },

  // Varsayılan rolleri oluştur
  async initializeDefaultRoles() {
    const rolesSnapshot = await getDocs(collection(db, 'roles'));
    const existingRoles = rolesSnapshot.docs.map(doc => doc.data().name);

    const defaultRoles = [
      {
        name: ROLES.YONETIM,
        description: 'Tam yetkili yönetici rolü',
        permissions: Object.values(PAGE_PERMISSIONS).flatMap(module => Object.values(module))
      },
      {
        name: ROLES.PERSONEL,
        description: 'Temel personel rolü',
        permissions: [
          PAGE_PERMISSIONS.AYARLAR.VIEW
        ]
      },
      {
        name: ROLES.SANTIYE_SEFI,
        description: 'Şantiye şefi rolü',
        permissions: [
          PAGE_PERMISSIONS.SANTIYE.VIEW,
          PAGE_PERMISSIONS.PERSONEL.VIEW,
          PAGE_PERMISSIONS.PUANTAJ.VIEW,
          PAGE_PERMISSIONS.DEPO.VIEW,
          PAGE_PERMISSIONS.GUNLUK_RAPOR.VIEW,
          PAGE_PERMISSIONS.AYARLAR.VIEW
        ]
      },
      {
        name: ROLES.MUHASEBE,
        description: 'Muhasebe rolü',
        permissions: [
          PAGE_PERMISSIONS.MASRAF_BEYAN.VIEW,
          PAGE_PERMISSIONS.HAKEDIS.VIEW,
          PAGE_PERMISSIONS.SOZLESME.VIEW,
          PAGE_PERMISSIONS.AYARLAR.VIEW
        ]
      }
    ];

    for (const role of defaultRoles) {
      if (!existingRoles.includes(role.name)) {
        await this.createRole(role);
      }
    }
  },

  // Kullanıcıya rol ata
  async assignRole(userId, roleId, assignedBy) {
    try {
      await addDoc(collection(db, USER_ROLES_COLLECTION), {
        userId,
        roleId,
        assignedBy,
        assignedAt: new Date()
      });
    } catch (error) {
      console.error('Rol atanırken hata:', error);
      throw error;
    }
  },

  // Kullanıcıdan rol kaldır
  async removeRole(userRoleId) {
    try {
      await deleteDoc(doc(db, USER_ROLES_COLLECTION, userRoleId));
    } catch (error) {
      console.error('Rol kaldırılırken hata:', error);
      throw error;
    }
  },

  // Kullanıcının yetkilerini güncelle
  async updateUserPermissions(userId, permissions) {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      await updateDoc(userRef, {
        permissions: permissions,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Kullanıcı yetkileri güncellenirken hata:', error);
      throw error;
    }
  }
}; 