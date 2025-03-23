import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
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

// Firestore ayarlarını yapılandır
const firestoreSettings = {
  ignoreUndefinedProperties: true,
  experimentalAutoDetectLongPolling: true
};

// Firestore'u persistence ile başlat
const db = initializeFirestore(app, {
  ...firestoreSettings,
  cache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Authentication'ı başlat
const auth = getAuth(app);

// Authentication persistence ayarını LOCAL olarak ayarla
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Authentication persistence hatası:", error);
  });

// Storage'ı başlat
const storage = getStorage(app);

export { db, auth, storage };
export default app;
