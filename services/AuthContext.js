// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase'; // ajusta o caminho se for diferente

const AuthContext = createContext();
export function AuthProvider({ children }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true); // pra evitar render enquanto carrega

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'user', user.uid));

          if (userDoc.exists()) {
            setUserData({
              uid: user.uid,
              email: user.email,
              ...userDoc.data(), // inclui nome, sobrenome, cpf, desc, etc.
            });
          } else {
            console.warn('Usuário logado, mas documento não encontrado no Firestore.');
            setUserData({
              uid: user.uid,
              email: user.email,
            });
          }
        } catch (error) {
          console.error('Erro ao buscar dados do Firestore:', error);
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return null; // ou um spinner

  return (
    <AuthContext.Provider value={{ userData, setUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
