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