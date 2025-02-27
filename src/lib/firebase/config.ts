import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBRQ6refYIK7IVVCo9-A6YrlbGBC_LDl_k",
  authDomain: "insaat-yonetim.firebaseapp.com",
  projectId: "insaat-yonetim",
  storageBucket: "insaat-yonetim.firebasestorage.app",
  messagingSenderId: "1024572737416",
  appId: "1:1024572737416:web:ed7786b5fcc122a21d9c3d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export app
export default app;
