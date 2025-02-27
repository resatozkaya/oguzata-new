import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase yapılandırması
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

// Servisleri başlat
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Servisleri dışa aktar
export { auth, db, storage };
export default app; 