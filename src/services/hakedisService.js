import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore';

export const hakedisService = {
    // Hakediş oluşturma
    async createHakedis(hakedisData) {
        try {
            const docRef = await addDoc(collection(db, 'hakedisler'), {
                ...hakedisData,
                olusturmaTarihi: new Date(),
                durum: 'taslak'
            });
            return docRef.id;
        } catch (error) {
            console.error('Hakediş oluşturma hatası:', error);
            throw error;
        }
    },

    // İmalat pozu ekleme
    async createPoz(pozData) {
        try {
            const docRef = await addDoc(collection(db, 'imalatPozlari'), pozData);
            return docRef.id;
        } catch (error) {
            console.error('Poz ekleme hatası:', error);
            throw error;
        }
    },

    // Metraj girişi
    async addMetraj(metrajData) {
        try {
            const docRef = await addDoc(collection(db, 'metrajlar'), metrajData);
            return docRef.id;
        } catch (error) {
            console.error('Metraj ekleme hatası:', error);
            throw error;
        }
    },

    // Hakediş durumu güncelleme
    async updateHakedisDurum(hakedisId, yeniDurum, onaylayanKullanici = null) {
        try {
            const hakedisRef = doc(db, 'hakedisler', hakedisId);
            const updateData = {
                durum: yeniDurum,
                guncellemeTarihi: new Date()
            };
            
            if (onaylayanKullanici && yeniDurum === 'onaylanmis') {
                updateData.onaylayanKullanici = onaylayanKullanici;
                updateData.onayTarihi = new Date();
            }

            await updateDoc(hakedisRef, updateData);
        } catch (error) {
            console.error('Hakediş durumu güncelleme hatası:', error);
            throw error;
        }
    },

    // Hakediş detayları getirme
    async getHakedisDetails(hakedisId) {
        try {
            const hakedisDoc = await getDoc(doc(db, 'hakedisler', hakedisId));
            if (!hakedisDoc.exists()) {
                throw new Error('Hakediş bulunamadı');
            }

            const metrajlarSnapshot = await getDocs(
                query(collection(db, 'metrajlar'), 
                where('hakedisId', '==', hakedisId))
            );

            const metrajlar = [];
            metrajlarSnapshot.forEach(doc => {
                metrajlar.push({ id: doc.id, ...doc.data() });
            });

            return {
                hakedis: { id: hakedisDoc.id, ...hakedisDoc.data() },
                metrajlar
            };
        } catch (error) {
            console.error('Hakediş detayları getirme hatası:', error);
            throw error;
        }
    },

    // Proje hakedişlerini listeleme
    async getProjeHakedisleri(projeId) {
        try {
            if (!projeId) {
                return [];
            }
            
            const hakedislerSnapshot = await getDocs(
                query(
                    collection(db, 'hakedisler'),
                    where('projeId', '==', projeId),
                    orderBy('hakedisNo', 'desc')
                )
            );

            const hakedisler = [];
            hakedislerSnapshot.forEach(doc => {
                hakedisler.push({ id: doc.id, ...doc.data() });
            });

            return hakedisler;
        } catch (error) {
            console.error('Proje hakedişleri getirme hatası:', error);
            throw error;
        }
    }
};
