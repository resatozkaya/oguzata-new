import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut, sendPasswordResetEmail, updatePassword as firebaseUpdatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { getDoc, doc, updateDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Eğer name ve surname yoksa, displayName'den ayırıyoruz
            if (!userData.name || !userData.surname) {
              const [firstName, ...lastNameParts] = (userData.displayName || user.displayName || '').split(' ');
              const lastName = lastNameParts.join(' ');
              
              // Firestore'u güncelle, role'ü değiştirmeden
              await updateDoc(doc(db, 'users', user.uid), {
                name: firstName || '',
                surname: lastName || '',
                updatedAt: new Date()
              });

              // Context'i güncelle, mevcut role'ü koru
              setCurrentUser({
                id: user.uid,
                ...userData,
                name: firstName || '',
                surname: lastName || ''
              });
            } else {
              setCurrentUser({
                id: user.uid,
                ...userData
              });
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const resetPassword = async (email) => {
    if (!email) {
      throw new Error('Email is required');
    }
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const updatePassword = async (newPassword) => {
    if (!auth.currentUser) {
      throw new Error('Kullanıcı oturum açmış olmalıdır');
    }

    try {
      await firebaseUpdatePassword(auth.currentUser, newPassword);
    } catch (error) {
      console.error('Şifre güncelleme hatası:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    setCurrentUser,
    logout,
    resetPassword,
    updatePassword,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
