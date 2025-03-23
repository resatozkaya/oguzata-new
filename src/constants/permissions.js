// Kullanıcı rolleri
export const ROLES = {
  YONETIM: 'YÖNETİM',
  PERSONEL: 'PERSONEL',
  SANTIYE_SEFI: 'SANTIYE_SEFI',
  MUHASEBE: 'MUHASEBE',
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
  SANTIYE: {
    VIEW: 'santiye_view',
    CREATE: 'santiye_create',
    UPDATE: 'santiye_update',
    DELETE: 'santiye_delete',
    MANAGE: 'santiye_manage',
  },
  PERSONEL: {
    VIEW: 'personel_view',
    CREATE: 'personel_create',
    UPDATE: 'personel_update',
    DELETE: 'personel_delete',
    MANAGE: 'personel_manage',
  },
  PUANTAJ: {
    VIEW: 'puantaj_view',
    CREATE: 'puantaj_create',
    UPDATE: 'puantaj_update',
    DELETE: 'puantaj_delete',
    MANAGE: 'puantaj_manage',
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
  },
  SOZLESME: {
    VIEW: 'sozlesme_view',
    CREATE: 'sozlesme_create',
    UPDATE: 'sozlesme_update',
    DELETE: 'sozlesme_delete',
    MANAGE: 'sozlesme_manage',
  },
  YESIL_DEFTER: {
    VIEW: 'yesil_defter_view',
    CREATE: 'yesil_defter_create',
    UPDATE: 'yesil_defter_update',
    DELETE: 'yesil_defter_delete',
    MANAGE: 'yesil_defter_manage',
  },
  ATASMAN: {
    VIEW: 'atasman_view',
    CREATE: 'atasman_create',
    UPDATE: 'atasman_update',
    DELETE: 'atasman_delete',
    MANAGE: 'atasman_manage',
  },
  METRAJ: {
    VIEW: 'metraj_view',
    CREATE: 'metraj_create',
    UPDATE: 'metraj_update',
    DELETE: 'metraj_delete',
    MANAGE: 'metraj_manage',
  },
  KESINTI: {
    VIEW: 'kesinti_view',
    CREATE: 'kesinti_create',
    UPDATE: 'kesinti_update',
    DELETE: 'kesinti_delete',
    MANAGE: 'kesinti_manage',
  },
  HAKEDIS: {
    VIEW: 'hakedis_view',
    CREATE: 'hakedis_create',
    UPDATE: 'hakedis_update',
    DELETE: 'hakedis_delete',
    MANAGE: 'hakedis_manage',
  },
  BIRIM_FIYAT: {
    VIEW: 'birim_fiyat_view',
    CREATE: 'birim_fiyat_create',
    UPDATE: 'birim_fiyat_update',
    DELETE: 'birim_fiyat_delete',
    MANAGE: 'birim_fiyat_manage',
  },
  TASERON: {
    VIEW: 'taseron_view',
    CREATE: 'taseron_create',
    UPDATE: 'taseron_update',
    DELETE: 'taseron_delete',
    MANAGE: 'taseron_manage',
  },
  TESLIMAT: {
    VIEW: 'teslimat_view',
    CREATE: 'teslimat_create',
    UPDATE: 'teslimat_update',
    DELETE: 'teslimat_delete',
    MANAGE: 'teslimat_manage',
  },
  MASRAF_BEYAN: {
    VIEW: 'masraf_beyan_view',
    CREATE: 'masraf_beyan_create',
    UPDATE: 'masraf_beyan_update',
    DELETE: 'masraf_beyan_delete',
    ONAY: 'masraf_beyan_onay',
    MUHASEBE: 'masraf_beyan_muhasebe',
    MANAGE: 'masraf_beyan_manage',
  },
  YONETIM: {
    VIEW: 'yonetim_view',
    CREATE: 'yonetim_create',
    UPDATE: 'yonetim_update',
    DELETE: 'yonetim_delete',
    MANAGE: 'yonetim_manage',
  },
  // Yeni eklenen izinler
  EKSIKLIK: {
    VIEW: 'eksiklik_view',
    CREATE: 'eksiklik_create',
    UPDATE: 'eksiklik_update',
    DELETE: 'eksiklik_delete',
    MANAGE: 'eksiklik_manage',
  },
  MESAJLASMA: {
    VIEW: 'mesajlasma_view',
    SEND: 'mesajlasma_send',
    DELETE: 'mesajlasma_delete',
    MANAGE: 'mesajlasma_manage',
  },
  AYARLAR: {
    VIEW: 'ayarlar_view',
    UPDATE: 'ayarlar_update',
    MANAGE: 'ayarlar_manage',
  },
};

// Her role ait yetkiler
export const ROLE_PERMISSIONS = {
  // YÖNETİM rolü tüm yetkilere sahip
  [ROLES.YONETIM]: Object.values(PAGE_PERMISSIONS).flatMap(module => 
    Object.values(module)
  ),
  
  // PERSONEL rolü temel yetkilere sahip
  [ROLES.PERSONEL]: [
    ...Object.values(PAGE_PERMISSIONS).map(module => module.VIEW),
    PAGE_PERMISSIONS.MESAJLASMA.SEND,
    PAGE_PERMISSIONS.AYARLAR.VIEW,
    PAGE_PERMISSIONS.AYARLAR.UPDATE,
  ],
  
  // SANTIYE_SEFI rolü kendi şantiyesinde geniş yetkilere sahip
  [ROLES.SANTIYE_SEFI]: [
    ...Object.values(PAGE_PERMISSIONS.SANTIYE),
    ...Object.values(PAGE_PERMISSIONS.PERSONEL),
    ...Object.values(PAGE_PERMISSIONS.PUANTAJ),
    ...Object.values(PAGE_PERMISSIONS.DEPO),
    ...Object.values(PAGE_PERMISSIONS.GUNLUK_RAPOR),
    ...Object.values(PAGE_PERMISSIONS.EKSIKLIK),
    ...Object.values(PAGE_PERMISSIONS.MESAJLASMA),
    PAGE_PERMISSIONS.TESLIMAT.VIEW,
    PAGE_PERMISSIONS.TESLIMAT.CREATE,
    PAGE_PERMISSIONS.MASRAF_BEYAN.VIEW,
    PAGE_PERMISSIONS.MASRAF_BEYAN.CREATE,
    PAGE_PERMISSIONS.AYARLAR.VIEW,
    PAGE_PERMISSIONS.AYARLAR.UPDATE,
  ],
  
  // MUHASEBE rolü finansal işlemlerde yetkili
  [ROLES.MUHASEBE]: [
    PAGE_PERMISSIONS.MASRAF_BEYAN.VIEW,
    PAGE_PERMISSIONS.MASRAF_BEYAN.CREATE,
    PAGE_PERMISSIONS.MASRAF_BEYAN.UPDATE,
    PAGE_PERMISSIONS.MASRAF_BEYAN.MUHASEBE,
    ...Object.values(PAGE_PERMISSIONS.HAKEDIS),
    ...Object.values(PAGE_PERMISSIONS.SOZLESME),
    ...Object.values(PAGE_PERMISSIONS.KESINTI),
    ...Object.values(PAGE_PERMISSIONS.BIRIM_FIYAT),
    ...Object.values(PAGE_PERMISSIONS.MESAJLASMA),
    PAGE_PERMISSIONS.AYARLAR.VIEW,
    PAGE_PERMISSIONS.AYARLAR.UPDATE,
  ],
};