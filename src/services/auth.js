import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase/config';

export const registerUser = async (email, password, name, role = 'PERSONEL', phone, surname) => {
  try {
    // Firebase Authentication'da kullanıcı oluştur
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Firestore'da kullanıcı dokümanı oluştur
    await setDoc(doc(db, 'users', user.uid), {
      email,
      name,
      surname,
      phone,
      roles: [role],
      permissions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return userCredential;
  } catch (error) {
    console.error('Kullanıcı kayıt hatası:', error);
    // Eğer auth kullanıcısı oluşturuldu ama Firestore kaydı başarısız olduysa
    // auth kullanıcısını sil
    if (error.code !== 'auth/email-already-in-use' && auth.currentUser) {
      await auth.currentUser.delete();
    }
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    return user;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  try {
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (!userDoc.exists()) return null;

    return {
      id: currentUser.uid,
      ...userDoc.data()
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
};
