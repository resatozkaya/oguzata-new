import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Kullanıcı bilgilerini Firestore'dan yükle
  const loadUserData = async (user) => {
    if (!user) {
      setCurrentUser(null);
      setUserRole(null);
      setUserPermissions([]);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Kullanıcı adı için öncelik sırası: Firestore displayName > Firestore name > Auth displayName > Email
        const displayName = userData.displayName || userData.name || user.displayName || user.email?.split('@')[0] || 'Kullanıcı';
        
        const updatedUser = {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          photoURL: user.photoURL || userData.photoURL || null,
          displayName: displayName,
          name: userData.name || displayName,
          role: userData.role || null,
          permissions: userData.permissions || [],
          santiye: userData.santiye || null,
          phoneNumber: userData.phoneNumber || user.phoneNumber || null,
          metadata: user.metadata,
          // Firebase auth user'dan gelen diğer önemli alanları koru
          ...Object.keys(user).reduce((acc, key) => {
            if (!['uid', 'email', 'emailVerified', 'photoURL', 'displayName', 'phoneNumber', 'metadata'].includes(key)) {
              acc[key] = user[key];
            }
            return acc;
          }, {})
        };
        
        console.log('Loaded user data:', { displayName, userData, updatedUser }); // Debug için
        
        setCurrentUser(updatedUser);
        setUserRole(userData.role || null);
        setUserPermissions(userData.permissions || []);
        
        return updatedUser;
      } else {
        console.warn('Kullanıcı dokümanı bulunamadı:', user.uid);
        // Firestore'da döküman yoksa en azından auth bilgilerini kullan
        const displayName = user.displayName || user.email?.split('@')[0] || 'Kullanıcı';
        const basicUser = {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          photoURL: user.photoURL || null,
          displayName: displayName,
          name: displayName,
          phoneNumber: user.phoneNumber || null,
          metadata: user.metadata
        };
        
        console.log('Basic user data:', basicUser); // Debug için
        
        setCurrentUser(basicUser);
        setUserRole(null);
        setUserPermissions([]);
      }
    } catch (error) {
      console.error('Kullanıcı bilgileri yüklenirken hata:', error);
      setError('Kullanıcı bilgileri yüklenemedi');
      // Hata durumunda en azından auth bilgilerini kullan
      const fallbackUser = {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        photoURL: user.photoURL || null,
        displayName: user.displayName || user.email,
        phoneNumber: user.phoneNumber || null,
        metadata: user.metadata
      };
      setCurrentUser(fallbackUser);
      setUserRole(null);
      setUserPermissions([]);
    }
  };

  useEffect(() => {
    let unsubscribe;
    
    const initializeAuth = async () => {
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        try {
          if (user) {
            await loadUserData(user);
          } else {
            setCurrentUser(null);
            setUserRole(null);
            setUserPermissions([]);
          }
        } catch (error) {
          console.error('Auth state değişikliğinde hata:', error);
        } finally {
          setLoading(false);
        }
      });
    };

    initializeAuth();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      setCurrentUser(null);
      setUserRole(null);
      setUserPermissions([]);
      window.location.href = '/login';
    } catch (error) {
      console.error('Çıkış yapma hatası:', error);
      setError('Çıkış yapılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    setCurrentUser,
    userRole,
    setUserRole,
    userPermissions,
    setUserPermissions,
    loading,
    setLoading,
    error,
    setError,
    logout,
    loadUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
