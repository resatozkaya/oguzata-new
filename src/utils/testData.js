import { eksiklikService } from '../services/eksiklikService';

export const ornekEksiklikEkle = async () => {
  const santiyeId = 'ANADOLU_1919';
  const blokId = 'A';

  const eksiklikler = [
    {
      daire_no: 101,
      aciklama: 'Mutfak dolabı montajı eksik',
      kategori: 'MOBILYA',
      durum: 'YENI',
      oncelik: 'NORMAL',
      taseron: 'AHMET_MOBILYA'
    },
    {
      daire_no: 102,
      aciklama: 'Banyo fayansları kırık',
      kategori: 'SERAMIK',
      durum: 'DEVAM_EDIYOR',
      oncelik: 'YUKSEK',
      taseron: 'CAN_SERAMIK'
    },
    {
      daire_no: 201,
      aciklama: 'Elektrik tesisatı arızalı',
      kategori: 'ELEKTRIK',
      durum: 'KRITIK',
      oncelik: 'KRITIK',
      taseron: 'YILMAZ_ELEKTRIK'
    }
  ];

  for (const eksiklik of eksiklikler) {
    try {
      await eksiklikService.eksiklikEkle(santiyeId, blokId, eksiklik);
      console.log('Örnek eksiklik eklendi:', eksiklik);
    } catch (error) {
      console.error('Örnek eksiklik eklenirken hata:', error);
    }
  }
};
