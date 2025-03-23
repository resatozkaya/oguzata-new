import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Firestore veritabanını başlat
const db = getFirestore(app);

// Authentication'ı başlat
const auth = getAuth(app);

// Storage'ı başlat
const storage = getStorage(app);

// Persistence ayarı
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db, {
    synchronizeTabs: true,
    experimentalForceOwningTab: true
  }).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence requires a single tab');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence is not available');
    } else {
      console.error('Firestore persistence error:', err);
    }
  });
}

// Google API uyarılarını gizle
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (e.message.includes('Tracking Prevention')) {
      e.stopPropagation();
      return false;
    }
  }, true);
}

export { app, auth, db, storage };
