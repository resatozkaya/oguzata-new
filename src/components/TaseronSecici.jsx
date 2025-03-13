import React, { useState, useEffect } from 'react';
import { TextField, Autocomplete } from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const TaseronSecici = ({ value, onChange, label = "Taşeron Seç" }) => {
    const [taseronlar, setTaseronlar] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTaseronlar = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'taseronlar'));
                const taseronList = querySnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        unvan: doc.data().unvan || '',
                        vergiDairesi: doc.data().vergiDairesi || '',
                        vergiNo: doc.data().vergiNo || '',
                        yetkili: doc.data().yetkili || '',
                        adres: doc.data().adres || '',
                        telefon: doc.data().telefon || '',
                        eposta: doc.data().eposta || ''
                    }))
                    .filter(taseron => taseron.unvan); // Boş ünvanları filtrele

                // Taşeronları ünvana göre sırala
                taseronList.sort((a, b) => a.unvan.localeCompare(b.unvan, 'tr'));
                setTaseronlar(taseronList);
            } catch (error) {
                console.error('Taşeronlar yüklenirken hata:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTaseronlar();
    }, []);

    return (
        <Autocomplete
            options={taseronlar}
            getOptionLabel={(option) => option?.unvan || ''}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            value={value}
            onChange={(event, newValue) => {
                onChange(newValue);
            }}
            renderOption={(props, option) => (
                <li {...props} key={option.id}>
                    {option.unvan}
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

export default TaseronSecici;
