import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut, sendPasswordResetEmail, updatePassword as firebaseUpdatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { getDoc, doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { USER_ROLES } from '../constants/permissions';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();

            let roles = userData.roles || [];
            if (userData.role === 'YÖNETİM' && !roles.includes('YÖNETİM')) {
              roles = [...roles, 'YÖNETİM'];
              await updateDoc(doc(db, 'users', user.uid), {
                roles: roles,
                updatedAt: new Date()
              });
            }

            const currentUser = {
              uid: user.uid,
              email: user.email,
              ...userData,
              roles: roles,
              permissions: userData.permissions || []
            };

            setCurrentUser(currentUser);
          } else {
            const newUser = {
              uid: user.uid,
              email: user.email,
              roles: ['USER'],
              permissions: []
            };
            await setDoc(doc(db, 'users', user.uid), newUser);
            setCurrentUser(newUser);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
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
    loading,
    logout: async () => {
      try {
        await signOut(auth);
      } catch (error) {
        console.error('Logout error:', error);
        throw error;
      }
    },
    resetPassword: async (email) => {
      try {
        await sendPasswordResetEmail(auth, email);
      } catch (error) {
        console.error('Reset password error:', error);
        throw error;
      }
    },
    updatePassword: async (currentPassword, newPassword) => {
      try {
        const user = auth.currentUser;
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await firebaseUpdatePassword(user, newPassword);
      } catch (error) {
        console.error('Update password error:', error);
        throw error;
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
