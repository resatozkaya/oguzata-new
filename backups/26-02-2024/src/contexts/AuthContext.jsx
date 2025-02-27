import React, { createContext, useContext, useState } from 'react';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState({
    name: "Admin",
    surname: "User",
    role: "ADMIN"
  });
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (error) {
      console.error('Çıkış yapılırken hata:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    setCurrentUser,
    loading,
    logout,
    hasPermission: () => true
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 