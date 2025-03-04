import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore';

export const personelOdemeService = {
    // Maaş kaydı oluşturma
    async createMaas(maasData) {
        try {
            const docRef = await addDoc(collection(db, 'personelOdemeleri/maaslar'), {
                ...maasData,
                olusturmaTarihi: new Date(),
                durum: 'bekliyor'
            });
            return docRef.id;
        } catch (error) {
            console.error('Maaş kaydı oluşturma hatası:', error);
            throw error;
        }
    },

    // Avans kaydı oluşturma
    async createAvans(avansData) {
        try {
            const docRef = await addDoc(collection(db, 'personelOdemeleri/avanslar'), {
                ...avansData,
                tarih: new Date(),
                durum: 'bekliyor'
            });
            return docRef.id;
        } catch (error) {
            console.error('Avans kaydı oluşturma hatası:', error);
            throw error;
        }
    },

    // Fazla mesai kaydı
    async addFazlaMesai(mesaiData) {
        try {
            const docRef = await addDoc(collection(db, 'personelOdemeleri/fazlaMesailer'), {
                ...mesaiData,
                kayitTarihi: new Date(),
                onayDurumu: 'bekliyor'
            });
            return docRef.id;
        } catch (error) {
            console.error('Fazla mesai kaydı hatası:', error);
            throw error;
        }
    },

    // Kesinti kaydı
    async addKesinti(kesintiData) {
        try {
            const docRef = await addDoc(collection(db, 'personelOdemeleri/kesintiler'), kesintiData);
            return docRef.id;
        } catch (error) {
            console.error('Kesinti kaydı hatası:', error);
            throw error;
        }
    },

    // Personel maaş detayları getirme
    async getPersonelMaasDetay(personelId, donem) {
        try {
            // Maaş bilgisi
            const maasSnapshot = await getDocs(
                query(
                    collection(db, 'personelOdemeleri/maaslar'),
                    where('personelId', '==', personelId),
                    where('donem', '==', donem)
                )
            );

            // Avanslar
            const avanslarSnapshot = await getDocs(
                query(
                    collection(db, 'personelOdemeleri/avanslar'),
                    where('personelId', '==', personelId),
                    where('donem', '==', donem)
                )
            );

            // Fazla mesailer
            const mesailerSnapshot = await getDocs(
                query(
                    collection(db, 'personelOdemeleri/fazlaMesailer'),
                    where('personelId', '==', personelId),
                    where('donem', '==', donem)
                )
            );

            // Kesintiler
            const kesintilerSnapshot = await getDocs(
                query(
                    collection(db, 'personelOdemeleri/kesintiler'),
                    where('personelId', '==', personelId),
                    where('donem', '==', donem)
                )
            );

            const maaslar = [];
            const avanslar = [];
            const mesailer = [];
            const kesintiler = [];

            maasSnapshot.forEach(doc => maaslar.push({ id: doc.id, ...doc.data() }));
            avanslarSnapshot.forEach(doc => avanslar.push({ id: doc.id, ...doc.data() }));
            mesailerSnapshot.forEach(doc => mesailer.push({ id: doc.id, ...doc.data() }));
            kesintilerSnapshot.forEach(doc => kesintiler.push({ id: doc.id, ...doc.data() }));

            return {
                maaslar,
                avanslar,
                mesailer,
                kesintiler
            };
        } catch (error) {
            console.error('Personel maaş detayları getirme hatası:', error);
            throw error;
        }
    },

    // Maaş durumu güncelleme
    async updateMaasDurum(maasId, yeniDurum) {
        try {
            const maasRef = doc(db, 'personelOdemeleri/maaslar', maasId);
            await updateDoc(maasRef, {
                durum: yeniDurum,
                guncellenmeTarihi: new Date()
            });
        } catch (error) {
            console.error('Maaş durumu güncelleme hatası:', error);
            throw error;
        }
    },

    // Avans durumu güncelleme
    async updateAvansDurum(avansId, yeniDurum) {
        try {
            const avansRef = doc(db, 'personelOdemeleri/avanslar', avansId);
            await updateDoc(avansRef, {
                durum: yeniDurum,
                guncellenmeTarihi: new Date()
            });
        } catch (error) {
            console.error('Avans durumu güncelleme hatası:', error);
            throw error;
        }
    }
};
