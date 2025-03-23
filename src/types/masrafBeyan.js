/**
 * @typedef {Object} MasrafKalemi
 * @property {string} id - Masraf kalemi ID
 * @property {string} tarih - Masraf tarihi
 * @property {string} aciklama - Masraf açıklaması
 * @property {number} tutar - Masraf tutarı
 * @property {string} paraBirimi - Para birimi (TL, USD, EUR)
 */

/**
 * @typedef {Object} MasrafBeyan
 * @property {string} id - Masraf beyan ID
 * @property {string} olusturanId - Oluşturan kullanıcı ID
 * @property {string} olusturanAdi - Oluşturan kullanıcı adı
 * @property {string} santiyeId - Şantiye ID
 * @property {string} santiyeAdi - Şantiye adı
 * @property {Date} tarih - Oluşturma tarihi
 * @property {MasrafKalemi[]} masraflar - Masraf kalemleri
 * @property {'BEKLEMEDE' | 'ONAYLANDI' | 'REDDEDILDI'} durumu - Beyan durumu
 * @property {string} [redNedeni] - Red nedeni (durumu REDDEDILDI ise)
 * @property {string} [onaylayanId] - Onaylayan kullanıcı ID
 * @property {string} [onaylayanAdi] - Onaylayan kullanıcı adı
 * @property {Date} [onayTarihi] - Onay tarihi
 * @property {boolean} [odendi] - Ödeme durumu
 * @property {string} [odeyenId] - Ödeyen kullanıcı ID
 * @property {string} [odeyenAdi] - Ödeyen kullanıcı adı
 * @property {Date} [odemeTarihi] - Ödeme tarihi
 * @property {string} [odemeAciklamasi] - Ödeme açıklaması
 */

export const MASRAF_BEYAN_DURUMLARI = {
  BEKLEMEDE: 'BEKLEMEDE',
  ONAYLANDI: 'ONAYLANDI',
  REDDEDILDI: 'REDDEDILDI'
};

export const PARA_BIRIMLERI = {
  TL: 'TL',
  USD: 'USD',
  EUR: 'EUR'
}; 