import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut, sendPasswordResetEmail, updatePassword as firebaseUpdatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { getDoc, doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { USER_ROLES } from '../constants/permissions';

export const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('User data from Firestore:', userData); // Debug için eklendi
            
            // Eğer name ve surname yoksa, displayName'den ayırıyoruz
            if (!userData.name || !userData.surname) {
              const [firstName, ...lastNameParts] = (userData.displayName || user.displayName || '').split(' ');
              const lastName = lastNameParts.join(' ');
              
              // Firestore'u güncelle
              await updateDoc(doc(db, 'users', user.uid), {
                name: firstName || '',
                surname: lastName || '',
                role: userData.role || USER_ROLES.USER,
                permissions: userData.permissions || [],
                updatedAt: new Date()
              });

              // Context'i güncelle
              const currentUser = {
                uid: user.uid,
                email: user.email,
                name: firstName || '',
                surname: lastName || '',
                role: userData.role || USER_ROLES.USER,
                permissions: userData.permissions || []
              };
              console.log('Updated currentUser:', currentUser); // Debug için eklendi
              setCurrentUser(currentUser);
            } else {
              // Rol kontrolü ve düzeltmesi
              let userRole = userData.role;
              if (userRole === 'YONETIM' || userRole === 'admin') {
                userRole = USER_ROLES.ADMIN;
                // Firestore'u güncelle
                await updateDoc(doc(db, 'users', user.uid), {
                  role: USER_ROLES.ADMIN,
                  permissions: userData.permissions || [],
                  updatedAt: new Date()
                });
              }

              const currentUser = {
                uid: user.uid,
                email: user.email,
                ...userData,
                role: userRole,
                permissions: userData.permissions || []
              };
              console.log('Current user with permissions:', currentUser); // Debug için eklendi
              setCurrentUser(currentUser);
            }

            // Kullanıcı yetkilerini güncelle
            setUserPermissions(userData.permissions || []);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setCurrentUser(null);
          setUserPermissions([]);
        }
      } else {
        setCurrentUser(null);
        setUserPermissions([]);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userPermissions,
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
