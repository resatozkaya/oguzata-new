import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const signup = async (email, password, userData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Firestore'a kullanıcı verilerini kaydet
      await setDoc(doc(db, 'users', user.uid), {
        ...userData,
        email: user.email,
        createdAt: new Date().toISOString(),
        role: 'user'
      });

      // Auth profilini güncelle
      await updateProfile(user, {
        displayName: userData.displayName
      });

      return user;
    } catch (error) {
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Firestore'dan kullanıcı verilerini al
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const updatedUser = {
          ...user,
          ...userData,
          displayName: userData.displayName || user.displayName || user.email?.split('@')[0],
          role: userData.role || 'user',
          permissions: userData.permissions || []
        };
        setCurrentUser(updatedUser);
        return updatedUser;
      }

      setCurrentUser(user);
      return user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (error) {
      throw error;
    }
  };

  const updateUserProfile = async (profileData) => {
    try {
      if (!currentUser) throw new Error('Kullanıcı oturumu bulunamadı');

      // Profil resmini Firestore'a kaydet, diğer bilgileri Auth'a da kaydet
      const { photoURL, ...authUpdateData } = profileData;

      // Auth profilini güncelle (photoURL hariç)
      if (Object.keys(authUpdateData).length > 0) {
        await updateProfile(auth.currentUser, authUpdateData);
      }

      // Firestore'daki kullanıcı verilerini güncelle
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, profileData); // Tüm verileri Firestore'a kaydet
      
      // Context'teki kullanıcı bilgilerini güncelle
      setCurrentUser(prev => ({
        ...prev,
        ...profileData
      }));

      return true;
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Firestore'dan kullanıcı verilerini al
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUser({
              ...user,
              ...userData,
              displayName: userData.displayName || user.displayName || user.email?.split('@')[0],
              role: userData.role || 'user',
              permissions: userData.permissions || []
            });
          } else {
            setCurrentUser(user);
          }
        } catch (error) {
          console.error('Kullanıcı bilgileri yüklenirken hata:', error);
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    setCurrentUser, // Login sayfası için gerekli
    signup,
    login,
    logout,
    updateUserProfile,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
