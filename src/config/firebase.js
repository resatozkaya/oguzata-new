import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBRQ6refYIK7IVVCo9-A6YrlbGBC_LDl_k",
  authDomain: "insaat-yonetim.firebaseapp.com",
  projectId: "insaat-yonetim",
  storageBucket: "insaat-yonetim.appspot.com",
  messagingSenderId: "1024572737416",
  appId: "1:1024572737416:web:ed7786b5fcc122a21d9c3d"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Firestore veritabanını başlat
const db = getFirestore(app);

// Çevrimdışı veri desteğini etkinleştir
enableMultiTabIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Çoklu sekme desteği için IndexedDB kullanılamıyor');
    } else if (err.code === 'unimplemented') {
      console.warn('Tarayıcınız IndexedDB desteklemiyor');
    }
  });

// Firestore ayarlarını yapılandır
const settings = {
  cacheSizeBytes: 40 * 1024 * 1024, // 40 MB
  ignoreUndefinedProperties: true,
  experimentalForceLongPolling: true, // WebSocket sorunlarını çözmek için
  experimentalAutoDetectLongPolling: true
};

// Authentication'ı başlat
const auth = getAuth(app);

// Storage'ı başlat
const storage = getStorage(app);

export { db, auth, storage };
export default app;
