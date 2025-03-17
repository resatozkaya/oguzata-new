// Temel CRUD işlemleri için yetkiler
export const CRUD_PERMISSIONS = {
  CREATE: '_create',
  READ: '_read',
  UPDATE: '_update',
  DELETE: '_delete',
};

// Sayfa bazlı yetkiler
export const PAGE_PERMISSIONS = {
  // Eksiklik Yönetimi
  EKSIKLIK: {
    VIEW: 'eksiklik_view',
    CREATE: 'eksiklik_create',
    UPDATE: 'eksiklik_update',
    DELETE: 'eksiklik_delete',
    MANAGE: 'eksiklik_manage', // Tüm yetkiler
  },

  // Depo Yönetimi
  DEPO: {
    VIEW: 'depo_view',
    CREATE: 'depo_create',
    UPDATE: 'depo_update',
    DELETE: 'depo_delete',
    MANAGE: 'depo_manage',
  },

  // Personel Yönetimi
  PERSONEL: {
    VIEW: 'personel_view',
    CREATE: 'personel_create',
    UPDATE: 'personel_update',
    DELETE: 'personel_delete',
    MANAGE: 'personel_manage',
    MANAGE_PERMISSIONS: 'personel_manage_permissions', // Personel yetkilerini yönetme
  },

  // Şantiye Yönetimi
  SANTIYE: {
    VIEW: 'santiye_view',
    CREATE: 'santiye_create',
    UPDATE: 'santiye_update',
    DELETE: 'santiye_delete',
    MANAGE: 'santiye_manage',
    MANAGE_PERMISSIONS: 'santiye_manage_permissions', // Şantiye yetkilerini yönetme
  },

  // Hakediş Yönetimi
  HAKEDIS: {
    VIEW: 'hakedis_view',
    CREATE: 'hakedis_create',
    UPDATE: 'hakedis_update',
    DELETE: 'hakedis_delete',
    MANAGE: 'hakedis_manage',
  },

  // Günlük Rapor
  GUNLUK_RAPOR: {
    VIEW: 'gunluk_rapor_view',
    CREATE: 'gunluk_rapor_create',
    UPDATE: 'gunluk_rapor_update',
    DELETE: 'gunluk_rapor_delete',
    MANAGE: 'gunluk_rapor_manage',
  },

  // Puantaj
  PUANTAJ: {
    VIEW: 'puantaj_view',
    CREATE: 'puantaj_create',
    UPDATE: 'puantaj_update',
    DELETE: 'puantaj_delete',
    MANAGE: 'puantaj_manage',
  },

  // Mesajlaşma
  MESAJLASMA: {
    VIEW: 'mesajlasma_view',
    CREATE: 'mesajlasma_create',
    UPDATE: 'mesajlasma_update',
    DELETE: 'mesajlasma_delete',
    MANAGE: 'mesajlasma_manage',
  },
};
