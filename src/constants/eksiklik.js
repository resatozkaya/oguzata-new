// Eksiklik Kategorileri
export const eksiklikKategorileri = {
  ELEKTRIK: 'Elektrik',
  MEKANIK: 'Mekanik',
  INSAAT: 'İnşaat',
  PEYZAJ: 'Peyzaj',
  DEKORASYON: 'Dekorasyon',
  DIGER: 'Diğer'
};

// Eksiklik Durumları
export const eksiklikDurumlari = {
  YENI: 'Yeni',
  DEVAM_EDIYOR: 'Devam Ediyor',
  BEKLEMEDE: 'Beklemede',
  TAMAMLANDI: 'Tamamlandı',
  KRITIK: 'Kritik'
};

// Eksiklik Öncelik Seviyeleri
export const eksiklikOncelikleri = {
  DUSUK: 'Düşük',
  NORMAL: 'Normal',
  YUKSEK: 'Yüksek',
  ACIL: 'Acil'
};

// Eksiklik Durum Renkleri
export const eksiklikDurumRenkleri = {
  YENI: 'bg-blue-500',
  DEVAM_EDIYOR: 'bg-yellow-500',
  BEKLEMEDE: 'bg-purple-500',
  TAMAMLANDI: 'bg-green-500',
  KRITIK: 'bg-red-500'
};

// Eksiklik Öncelik Renkleri
export const eksiklikOncelikRenkleri = {
  DUSUK: 'bg-gray-500',
  NORMAL: 'bg-blue-500',
  YUKSEK: 'bg-orange-500',
  ACIL: 'bg-red-500'
};

// Varsayılan Bina Yapısı
export const varsayilanBinaYapisi = {
  bloklar: [{
    ad: 'A',
    katlar: [
      {
        no: 3,
        daireler: Array.from({ length: 8 }, (_, i) => ({ no: 301 + i }))
      },
      {
        no: 2,
        daireler: Array.from({ length: 8 }, (_, i) => ({ no: 201 + i }))
      },
      {
        no: 1,
        daireler: Array.from({ length: 8 }, (_, i) => ({ no: 101 + i }))
      },
      {
        no: 0,
        daireler: [
          { no: 'zemin_b', ad: 'B ZEMİN' },
          { no: 'elektrik_zemin', ad: 'ELEKTRİK ŞAFT ZEMİN' },
          { no: 'mekanik_zemin', ad: 'MEKANİK ŞAFT ZEMİN' },
          { no: 'z1_mekanik', ad: 'Z+1 ARA KAT MEKANİK' }
        ]
      }
    ]
  }]
};

// Özel Alan Tipleri
export const ozelAlanTipleri = {
  MEKANIK_SAFT: 'Mekanik Şaft',
  ELEKTRIK_SAFT: 'Elektrik Şaft',
  YANGIN_MERDIVEN: 'Yangın Merdiveni',
  KAT_MERDIVEN: 'Kat Merdiveni',
  KAT_HOLU: 'Kat Holü'
};
