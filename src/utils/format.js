/**
 * Tarihi formatla
 * @param {Date|string|number} date 
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * Para birimini formatla
 * @param {number} amount 
 * @param {string} currency 
 * @returns {string}
 */
export const formatCurrency = (amount, currency = 'TL') => {
  if (typeof amount !== 'number') return '';

  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency === 'TL' ? 'TRY' : currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
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