// Hakediş veri modeli
export const hakedisDurumlari = [
    { id: 'hazirlaniyor', label: 'Hazırlanıyor' },
    { id: 'onayBekliyor', label: 'Onay Bekliyor' },
    { id: 'onaylandi', label: 'Onaylandı' },
    { id: 'reddedildi', label: 'Reddedildi' }
];

export const odemeDurumlari = [
    { id: 'odenmedi', label: 'Ödenmedi' },
    { id: 'kismiOdendi', label: 'Kısmi Ödendi' },
    { id: 'odendi', label: 'Ödendi' }
];

// Hakediş şeması
export const hakedisSchema = {
    id: '',
    hakedisNo: '',
    santiye: {
        id: '',
        ad: '',
        kod: ''
    },
    taseron: {
        id: '',
        unvan: '',
        vergiNo: ''
    },
    sozlesme: {
        id: '',
        sozlesmeNo: '',
        sozlesmeTuru: '',
        paraBirimi: ''
    },
    donem: null,
    ilerlemeYuzdesi: 0, // Götüre bedel için
    toplamTutar: 0,
    teminatKesintisi: 0,
    digerKesintiler: 0,
    kesintilerAciklama: '',
    netTutar: 0,
    onayDurumu: 'hazirlaniyor',
    onayAciklama: '',
    onaylayanKullanici: null,
    onayTarihi: null,
    odemeDurumu: 'odenmedi',
    odemeTarihi: null,
    metrajlar: [], // Birim fiyatlı işler için
    yesilDefterKalemleri: [], // Ek işler için
    avanslar: [], // Mahsup edilecek avanslar
    olusturanKullanici: null,
    olusturmaTarihi: null,
    guncelleyenKullanici: null,
    guncellemeTarihi: null
};

// Metraj şeması
export const metrajSchema = {
    id: '',
    birimFiyatId: '',
    pozNo: '',
    isKalemi: '',
    birim: '',
    miktar: 0,
    birimFiyat: 0,
    tutar: 0
};

// Yeşil defter kalemi şeması
export const yesilDefterKalemiSchema = {
    id: '',
    isTarihi: null,
    isAciklamasi: '',
    birim: '',
    miktar: 0,
    birimFiyat: 0,
    tutar: 0,
    onayDurumu: 'beklemede'
};

// Avans şeması
export const avansSchema = {
    id: '',
    avansTarihi: null,
    avansTutari: 0,
    mahsupTutari: 0,
    aciklama: ''
};
