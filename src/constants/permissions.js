// Kullanıcı rolleri
export const USER_ROLES = {
  ADMIN: 'YÖNETİM',
  USER: 'KULLANICI'
};

// CRUD işlemleri için temel yetkiler
export const CRUD_PERMISSIONS = {
  VIEW: 'view',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage'
};

// Sayfa bazlı yetkiler
export const PAGE_PERMISSIONS = {
  PERSONEL: {
    VIEW: 'personel_view',
    CREATE: 'personel_create',
    UPDATE: 'personel_update',
    DELETE: 'personel_delete',
    MANAGE: 'personel_manage',
    MANAGE_PERMISSIONS: 'personel_manage_permissions', // Personel yetkilerini yönetme
  },
  SANTIYE: {
    VIEW: 'santiye_view',
    CREATE: 'santiye_create',
    UPDATE: 'santiye_update',
    DELETE: 'santiye_delete',
    MANAGE: 'santiye_manage',
    MANAGE_PERMISSIONS: 'santiye_manage_permissions', // Şantiye yetkilerini yönetme
  },
  PUANTAJ: {
    VIEW: 'puantaj_view',
    CREATE: 'puantaj_create',
    UPDATE: 'puantaj_update',
    DELETE: 'puantaj_delete',
    MANAGE: 'puantaj_manage',
  },
  HAKEDIS: {
    VIEW: 'hakedis_view',
    CREATE: 'hakedis_create',
    UPDATE: 'hakedis_update',
    DELETE: 'hakedis_delete',
    MANAGE: 'hakedis_manage',
  },
  EKSIKLIK: {
    VIEW: 'eksiklik_view',
    CREATE: 'eksiklik_create',
    UPDATE: 'eksiklik_update',
    DELETE: 'eksiklik_delete',
    MANAGE: 'eksiklik_manage',
    BINA_YAPISI: 'eksiklik_bina_yapisi',
    BLOK_YONETIMI: 'eksiklik_blok_yonetimi',
    MANAGE_PERMISSIONS: 'eksiklik_manage_permissions'
  },
  SOZLESME: {
    VIEW: 'sozlesme_view',
    CREATE: 'sozlesme_create',
    UPDATE: 'sozlesme_update',
    DELETE: 'sozlesme_delete',
    MANAGE: 'sozlesme_manage',
  },
  DEPO: {
    VIEW: 'depo_view',
    CREATE: 'depo_create',
    UPDATE: 'depo_update',
    DELETE: 'depo_delete',
    MANAGE: 'depo_manage',
  },
  GUNLUK_RAPOR: {
    VIEW: 'gunluk_rapor_view',
    CREATE: 'gunluk_rapor_create',
    UPDATE: 'gunluk_rapor_update',
    DELETE: 'gunluk_rapor_delete',
    MANAGE: 'gunluk_rapor_manage',
    VIEW_ALL: 'gunluk_rapor_view_all', 
  },
  TESLIMAT: {
    VIEW: 'teslimat_view',
    CREATE: 'teslimat_create',
    UPDATE: 'teslimat_update',
    DELETE: 'teslimat_delete',
    MANAGE: 'teslimat_manage',
  },
  YESIL_DEFTER: {
    VIEW: 'yesil_defter_view',
    CREATE: 'yesil_defter_create',
    UPDATE: 'yesil_defter_update',
    DELETE: 'yesil_defter_delete',
    MANAGE: 'yesil_defter_manage',
  }
};

// Rol bazlı yetki grupları
export const DEFAULT_PERMISSIONS = {
  [USER_ROLES.ADMIN]: Object.values(PAGE_PERMISSIONS).reduce((acc, module) => {
    return [...acc, ...Object.values(module)];
  }, []),
  [USER_ROLES.USER]: [
    PAGE_PERMISSIONS.PERSONEL.VIEW,
    PAGE_PERMISSIONS.SANTIYE.VIEW,
    PAGE_PERMISSIONS.PUANTAJ.VIEW,
    PAGE_PERMISSIONS.HAKEDIS.VIEW,
    PAGE_PERMISSIONS.EKSIKLIK.VIEW,
    PAGE_PERMISSIONS.SOZLESME.VIEW,
    PAGE_PERMISSIONS.DEPO.VIEW,
    PAGE_PERMISSIONS.GUNLUK_RAPOR.VIEW,
    PAGE_PERMISSIONS.TESLIMAT.VIEW,
    PAGE_PERMISSIONS.YESIL_DEFTER.VIEW
  ]
};