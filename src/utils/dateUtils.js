import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// Tarih formatla
export const formatDate = (date) => {
    if (!date) return '-';
    try {
        return format(date, 'dd.MM.yyyy', { locale: tr });
    } catch (error) {
        console.error('Tarih formatlanırken hata:', error);
        return '-';
    }
};

// Tarih formatla
export const formatTableDate = (date) => {
    if (!date) return '-';
    try {
        return format(date, 'dd.MM.yyyy', { locale: tr });
    } catch (error) {
        console.error('Tarih formatlanırken hata:', error);
        return '-';
    }
};

// Saat formatla
export const formatTime = (date) => {
    if (!date) return '-';
    try {
        return format(date, 'HH:mm', { locale: tr });
    } catch (error) {
        console.error('Saat formatlanırken hata:', error);
        return '-';
    }
};

// Tarih ve saat formatla
export const formatDateTime = (date) => {
    if (!date) return '-';
    try {
        return format(date, 'dd.MM.yyyy HH:mm', { locale: tr });
    } catch (error) {
        console.error('Tarih ve saat formatlanırken hata:', error);
        return '-';
    }
};
