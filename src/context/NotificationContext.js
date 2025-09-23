import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, db } from '../../services/firebase';
import { collection, query, where, onSnapshot, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadReviews, setUnreadReviews] = useState(0);
  const [totalUnread, setTotalUnread] = useState(0);
  const [lastMessageTime, setLastMessageTime] = useState(null);
  const [lastReviewTime, setLastReviewTime] = useState(null);

  const uid = auth.currentUser?.uid;

  // Baselines para considerar itens como "novos" após o app abrir ou marcar como lido
  const lastReadMessagesAtRef = useRef(new Date());
  const lastReadReviewsAtRef = useRef(new Date());
  // Unsubscribers dinâmicos
  const chatMsgUnsubsRef = useRef(new Map()); // chatId -> unsub
  const reviewUnsubsRef = useRef(new Map());   // eventId -> unsub

  // Monitorar novas mensagens em tempo real (por mensagem)
  useEffect(() => {
    // Limpeza quando usuário não está autenticado
    if (!uid) {
      setUnreadMessages(0);
      try { chatMsgUnsubsRef.current.forEach(u => u && u()); } catch (_) {}
      chatMsgUnsubsRef.current.clear();
      return;
    }

    // Baseline: a partir de agora contam apenas mensagens posteriores
    lastReadMessagesAtRef.current = new Date();

    const chatsRef = collection(db, 'chats');
    const qChats = query(chatsRef, where('participants', 'array-contains', uid));

    const unsubChats = onSnapshot(qChats, (snapshot) => {
      const activeChatIds = new Set();

      snapshot.docs.forEach((chatDoc) => {
        const chatId = chatDoc.id;
        activeChatIds.add(chatId);

        if (!chatMsgUnsubsRef.current.has(chatId)) {
          const msgsRef = collection(db, 'chats', chatId, 'messages');
          const qMsgs = query(msgsRef, orderBy('timestamp'));
          const unsubMsgs = onSnapshot(qMsgs, (msgSnap) => {
            let inc = 0;
            msgSnap.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const m = change.doc.data() || {};
                const ts = m.timestamp?.toDate ? m.timestamp.toDate() : (m.timestamp ? new Date(m.timestamp) : null);
                if (ts && ts > lastReadMessagesAtRef.current && m.userId && m.userId !== uid) {
                  inc++;
                }
              }
            });
            if (inc > 0) setUnreadMessages(prev => prev + inc);
          });
          chatMsgUnsubsRef.current.set(chatId, unsubMsgs);
        }
      });

      // Remover listeners de chats que saíram do escopo
      Array.from(chatMsgUnsubsRef.current.keys()).forEach((chatId) => {
        if (!activeChatIds.has(chatId)) {
          try { chatMsgUnsubsRef.current.get(chatId)?.(); } catch (_) {}
          chatMsgUnsubsRef.current.delete(chatId);
        }
      });
    });

    return () => {
      try { unsubChats(); } catch (_) {}
      try { chatMsgUnsubsRef.current.forEach(u => u && u()); } catch (_) {}
      chatMsgUnsubsRef.current.clear();
    };
  }, [uid]);

  // Monitorar novas avaliações/comentários em tempo real (por avaliação)
  useEffect(() => {
    if (!uid) {
      setUnreadReviews(0);
      try { reviewUnsubsRef.current.forEach(u => u && u()); } catch (_) {}
      reviewUnsubsRef.current.clear();
      return;
    }

    // Baseline para avaliações
    lastReadReviewsAtRef.current = new Date();

    const fetchOwnedEventsAndSubscribe = async () => {
      try {
        // Buscar eventos do usuário
        const eventsRef = collection(db, 'events');
        const queries = [
          query(eventsRef, where('uid', '==', uid)),
          query(eventsRef, where('ownerId', '==', uid)),
          query(eventsRef, where('userId', '==', uid)),
          // Campos legados/alternativos
          query(eventsRef, where('creatorId', '==', uid)),
          query(eventsRef, where('userUID', '==', uid)),
        ];

        try {
          queries.push(query(eventsRef, where('creator.uid', '==', uid)));
        } catch (_) {}

        const results = await Promise.all(
          queries.map(async (q) => {
            try {
              const snapshot = await getDocs(q);
              return snapshot.docs.map(doc => ({ id: doc.id }));
            } catch (_) {
              return [];
            }
          })
        );

        const eventIds = results.flat().map(e => e.id);

        if (eventIds.length === 0) {
          setUnreadReviews(0);
          return;
        }

        // Criar/garantir listeners por evento
        const active = new Set();
        eventIds.forEach((eventId) => {
          active.add(eventId);
          if (reviewUnsubsRef.current.has(eventId)) return;

          const reviewsRef = collection(db, 'events', eventId, 'avaliacoes');
          const qRev = query(reviewsRef, orderBy('createdAt'));
          const unsub = onSnapshot(qRev, (snap) => {
            let inc = 0;
            snap.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const d = change.doc.data() || {};
                const createdAt = d.createdAt?.toDate ? d.createdAt.toDate() : (d.createdAt ? new Date(d.createdAt) : null);
                if (createdAt && createdAt > lastReadReviewsAtRef.current) {
                  inc++;
                }
              }
            });
            if (inc > 0) setUnreadReviews(prev => prev + inc);
          });
          reviewUnsubsRef.current.set(eventId, unsub);
        });

        // Remover listeners de eventos que saíram
        Array.from(reviewUnsubsRef.current.keys()).forEach((eventId) => {
          if (!active.has(eventId)) {
            try { reviewUnsubsRef.current.get(eventId)?.(); } catch (_) {}
            reviewUnsubsRef.current.delete(eventId);
          }
        });

      } catch (error) {
        console.error('Erro ao monitorar avaliações:', error);
        setUnreadReviews(0);
      }
    };

    fetchOwnedEventsAndSubscribe();

    return () => {
      try { reviewUnsubsRef.current.forEach(u => u && u()); } catch (_) {}
      reviewUnsubsRef.current.clear();
    };
  }, [uid]);

  // Calcular total de notificações não lidas
  useEffect(() => {
    setTotalUnread(unreadMessages + unreadReviews);
  }, [unreadMessages, unreadReviews]);

  // Função para marcar notificações como lidas
  const markAsRead = () => {
    // Zera contadores e avança baseline para "agora"
    setUnreadMessages(0);
    setUnreadReviews(0);
    const now = new Date();
    lastReadMessagesAtRef.current = now;
    lastReadReviewsAtRef.current = now;
    // Mantém estados antigos por compatibilidade, mas sem dependência
    setLastMessageTime(now);
    setLastReviewTime(now);
  };

  const value = {
    unreadMessages,
    unreadReviews,
    totalUnread,
    markAsRead
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
