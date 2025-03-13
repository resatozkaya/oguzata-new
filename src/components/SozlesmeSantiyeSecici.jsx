import React, { useState, useEffect } from 'react';
import { TextField, Autocomplete } from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const SozlesmeSantiyeSecici = ({ value, onChange, label = "Şantiye Seç" }) => {
    const [santiyeler, setSantiyeler] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSantiyeler = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'santiyeler'));
                const santiyeList = querySnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        santiyeAdi: doc.data().ad || '',
                        kod: doc.data().kod || ''
                    }))
                    .filter(santiye => santiye.santiyeAdi); // Boş şantiye adlarını filtrele

                // Şantiyeleri ada göre sırala
                santiyeList.sort((a, b) => a.santiyeAdi.localeCompare(b.santiyeAdi, 'tr'));
                setSantiyeler(santiyeList);
            } catch (error) {
                console.error('Şantiyeler yüklenirken hata:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSantiyeler();
    }, []);

    return (
        <Autocomplete
            options={santiyeler}
            getOptionLabel={(option) => option?.santiyeAdi || ''}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            value={value}
            onChange={(event, newValue) => {
                onChange(newValue);
            }}
            renderOption={(props, option) => (
                <li {...props} key={option.id}>
                    {option.santiyeAdi} {option.kod ? `(${option.kod})` : ''}
                </li>
            )}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    fullWidth
                    sx={{
                        '& .MuiInputBase-input': {
                            color: 'text.primary',
                        },
                        '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                                borderColor: 'primary.main',
                            },
                            '&:hover fieldset': {
                                borderColor: 'primary.main',
                            },
                        },
                        '& .MuiInputLabel-root': {
                            color: 'text.primary',
                        }
                    }}
                />
            )}
            loading={loading}
        />
    );
};

export default SozlesmeSantiyeSecici;
