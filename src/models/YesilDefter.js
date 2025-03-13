// Yeşil Defter veri modeli
export const yesilDefterDurumlari = [
    { id: 'beklemede', label: 'Beklemede' },
    { id: 'onaylandi', label: 'Onaylandı' },
    { id: 'reddedildi', label: 'Reddedildi' }
];

// Yeşil Defter şeması
export const yesilDefterSchema = {
    id: '',
    santiye: {
        id: '',
        ad: '',
        kod: ''
    },
    taseron: {
        id: '',
        unvan: ''
    },
    isTarihi: null,
    isAciklamasi: '',
    birim: '',
    miktar: 0,
    birimFiyat: 0,
    toplamTutar: 0,
    paraBirimi: 'TRY',
    onayDurumu: 'beklemede',
    onayAciklama: '',
    onaylayanKullanici: null,
    onayTarihi: null,
    hakedisId: '', // Eğer bir hakedişe eklendiyse
    olusturanKullanici: null,
    olusturmaTarihi: null,
    guncelleyenKullanici: null,
    guncellemeTarihi: null
};

// Birim listesi
export const birimListesi = [
    { id: 'm2', label: 'm²' },
    { id: 'm3', label: 'm³' },
    { id: 'mt', label: 'mt' },
    { id: 'adet', label: 'Adet' },
    { id: 'kg', label: 'kg' },
    { id: 'ton', label: 'ton' },
    { id: 'paket', label: 'Paket' },
    { id: 'gun', label: 'Gün' },
    { id: 'ay', label: 'Ay' },
    { id: 'sefer', label: 'Sefer' }
];
