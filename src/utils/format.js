import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

/**
 * Tarihi formatla
 * @param {Date|string|number} date 
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date) return '-';
  try {
    if (date instanceof Date) {
      return format(date, 'dd.MM.yyyy', { locale: tr });
    } else if (date.seconds) {
      return format(new Date(date.seconds * 1000), 'dd.MM.yyyy', { locale: tr });
    }
    return '-';
  } catch (error) {
    console.error('Tarih formatlanırken hata:', error);
    return '-';
  }
};

/**
 * Para birimini formatla
 * @param {number} amount 
 * @param {string} currency 
 * @returns {string}
 */
export const formatCurrency = (amount, currency = 'TL') => {
  if (amount === null || amount === undefined) return '-';
  return `${Number(amount).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} ${currency}`;
};

// Para birimi formatı için yardımcı fonksiyon
export const formatMoney = (amount, currency = 'TRY') => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₺0,00';
  }
  
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}; 