import React, { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import sozlesmeService from '../services/sozlesmeService';

const SozlesmeSecici = ({ value, onChange, label = "Sözleşme Seçin" }) => {
    const { currentUser } = useAuth();
    const [sozlesmeler, setSozlesmeler] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSozlesmeler = async () => {
            if (!currentUser?.uid) {
                console.log('Kullanıcı bilgisi bulunamadı');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                console.log('Sözleşmeler yükleniyor...');
                console.log('Current User:', currentUser.uid);
                
                const sozlesmeData = await sozlesmeService.getSozlesmeler({
                    kullaniciId: currentUser.uid,
                    durum: 'aktif'
                });
                
                console.log('Yüklenen sözleşmeler:', sozlesmeData);
                setSozlesmeler(sozlesmeData);
            } catch (error) {
                console.error('Sözleşmeler yüklenirken hata:', error);
                setSozlesmeler([]); // Hata durumunda boş array set et
            } finally {
                setLoading(false);
            }
        };

        fetchSozlesmeler();
    }, [currentUser]);

    const handleChange = (e) => {
        const selectedValue = e.target.value;
        console.log('Seçilen sözleşme değeri:', selectedValue);
        
        if (!selectedValue) {
            console.log('Sözleşme seçimi temizlendi');
            onChange(e, null);
            return;
        }

        const selectedContract = sozlesmeler.find(s => s.id === selectedValue);
        console.log('Bulunan sözleşme:', selectedContract);
        onChange(e, selectedContract);
    };

    return (
        <FormControl fullWidth>
            <InputLabel>{label}</InputLabel>
            <Select
                value={value}
                onChange={handleChange}
                label={label}
                disabled={loading}
            >
                <MenuItem value="">
                    <em>Seçiniz</em>
                </MenuItem>
                {sozlesmeler.map((sozlesme) => (
                    <MenuItem key={sozlesme.id} value={sozlesme.id}>
                        {sozlesme.sozlesmeNo} - {sozlesme.taseron?.unvan} ({sozlesme.santiye?.ad})
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

export default SozlesmeSecici; 