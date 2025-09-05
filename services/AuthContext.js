// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeIsOrganizer = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
              if (user) {
          try {
            const userRef = doc(db, 'user', user.uid);
          const docSnapshot = await getDoc(userRef);

          if (docSnapshot.exists()) {
            const data = docSnapshot.data();

            // Define dados iniciais padronizados
            setUserData({
              uid: user.uid,
              email: user.email,
              userInfo: data || {},
              isOrganizer: !!data?.isOrganizer,
            });

            // Escuta atualizações do doc do usuário em tempo real
            unsubscribeIsOrganizer = onSnapshot(userRef, (snap) => {
              const newData = snap.data() || {};
              setUserData(prev => ({
                ...prev,
                userInfo: newData,
                isOrganizer: !!newData.isOrganizer,
              }));
            });

          } else {
            console.warn('Documento do usuário não encontrado.');
            setUserData({
              uid: user.uid,
              email: user.email,
              userInfo: {},
              isOrganizer: false,
            });
          }
        } catch (error) {
          console.error('Erro ao buscar dados do Firestore:', error);
        }

        setLoading(false);
      } else {
        if (unsubscribeIsOrganizer) unsubscribeIsOrganizer();
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeIsOrganizer) unsubscribeIsOrganizer();
    };
  }, []);

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ userData, setUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
