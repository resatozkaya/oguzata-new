// Sözleşme veri modeli
export const sozlesmeTurleri = [
    { id: 'birimFiyat', label: 'Birim Fiyat' },
    { id: 'gotureBedel', label: 'Götüre Bedel (Anahtar Teslim)' },
    { id: 'daireKarsiligi', label: 'Daire Karşılığı' },
    { id: 'maliyetKar', label: 'Maliyet + Kâr' },
    { id: 'karma', label: 'Karma Sistem' }
];

export const paraBirimleri = [
    { value: 'TRY', label: 'Türk Lirası (₺)' },
    { value: 'USD', label: 'Amerikan Doları ($)' },
    { value: 'EUR', label: 'Euro (€)' }
];

export const sozlesmeDurumlari = [
    { id: 'aktif', label: 'Aktif' },
    { id: 'iptal', label: 'İptal' },
    { id: 'tamamlandi', label: 'Tamamlandı' }
];

// Sözleşme şeması
export const sozlesmeSchema = {
    id: '',
    santiye: {
        id: '',
        ad: '',
        kod: ''
    },
    taseron: {
        id: '',
        unvan: '',
        vergiNo: '',
        yetkili: ''
    },
    sozlesmeNo: '',
    sozlesmeTuru: '',
    sozlesmeAdi: '',
    sozlesmeTarihi: null,
    baslangicTarihi: null,
    bitisTarihi: null,
    toplamBedel: 0,
    teminatOrani: 0,
    paraBirimi: 'TRY',
    aciklama: '',
    dosyaUrl: '',
    durum: 'aktif',
    birimFiyatlar: [],
    olusturanKullanici: null,
    olusturmaTarihi: null,
    guncelleyenKullanici: null,
    guncellemeTarihi: null
};
