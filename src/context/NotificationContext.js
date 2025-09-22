import React, { createContext, useContext, useState, useEffect } from 'react';
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

  // Monitorar novas mensagens em tempo real
  useEffect(() => {
    if (!uid) {
      setUnreadMessages(0);
      return;
    }

    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', uid));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      let newMessages = 0;
      let latestMessageTime = null;

      for (const doc of snapshot.docs) {
        const chatData = doc.data();
        const updatedAt = chatData.updated_at?.toDate ? chatData.updated_at.toDate() : null;

        // Se a última atualização foi depois da última vez que verificamos
        if (updatedAt && (!lastMessageTime || updatedAt > lastMessageTime)) {
          // Verificar se é uma mensagem nova (não enviada pelo usuário atual)
          const participants = Array.isArray(chatData.participants) ? chatData.participants : [];
          const otherParticipant = participants.find(p => p && p !== uid);

          if (otherParticipant && chatData.last_message && chatData.user_uid !== uid) {
            newMessages++;
          }
        }

        if (updatedAt && (!latestMessageTime || updatedAt > latestMessageTime)) {
          latestMessageTime = updatedAt;
        }
      }

      setUnreadMessages(newMessages);
      if (latestMessageTime && (!lastMessageTime || latestMessageTime > lastMessageTime)) {
        setLastMessageTime(latestMessageTime);
      }
    });

    return () => unsubscribe();
  }, [uid, lastMessageTime]);

  // Monitorar novas avaliações/comentários em tempo real
  useEffect(() => {
    if (!uid) {
      setUnreadReviews(0);
      return;
    }

    const fetchOwnedEventsAndSubscribe = async () => {
      try {
        // Buscar eventos do usuário
        const eventsRef = collection(db, 'events');
        const queries = [
          query(eventsRef, where('uid', '==', uid)),
          query(eventsRef, where('ownerId', '==', uid)),
          query(eventsRef, where('userId', '==', uid)),
        ];

        // Adicionar query para creator.uid se possível
        try {
          queries.push(query(eventsRef, where('creator.uid', '==', uid)));
        } catch (e) {
          // Ignorar erro se índice não existir
        }

        // Executar queries para encontrar eventos do usuário
        const results = await Promise.all(
          queries.map(async (q) => {
            try {
              const snapshot = await getDocs(q);
              return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (e) {
              return [];
            }
          })
        );

        const allEvents = results.flat();
        const eventIds = allEvents.map(event => event.id);

        if (eventIds.length === 0) {
          setUnreadReviews(0);
          return;
        }

        let newReviews = 0;
        let latestReviewTime = null;

        // Monitorar avaliações para cada evento
        const unsubscribers = eventIds.map((eventId) => {
          const reviewsRef = collection(db, 'events', eventId, 'avaliacoes');
          const q = query(reviewsRef, orderBy('createdAt', 'desc'));

          return onSnapshot(q, (snapshot) => {
            snapshot.docs.forEach((doc) => {
              const reviewData = doc.data();
              const createdAt = reviewData.createdAt?.toDate ? reviewData.createdAt.toDate() : null;

              if (createdAt && (!lastReviewTime || createdAt > lastReviewTime)) {
                newReviews++;
              }

              if (createdAt && (!latestReviewTime || createdAt > latestReviewTime)) {
                latestReviewTime = createdAt;
              }
            });

            setUnreadReviews(newReviews);
            if (latestReviewTime && (!lastReviewTime || latestReviewTime > lastReviewTime)) {
              setLastReviewTime(latestReviewTime);
            }
          });
        });

        return () => {
          unsubscribers.forEach(unsub => unsub());
        };
      } catch (error) {
        console.error('Erro ao monitorar avaliações:', error);
        setUnreadReviews(0);
      }
    };

    const unsubscribe = fetchOwnedEventsAndSubscribe();

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [uid, lastReviewTime]);

  // Calcular total de notificações não lidas
  useEffect(() => {
    setTotalUnread(unreadMessages + unreadReviews);
  }, [unreadMessages, unreadReviews]);

  // Função para marcar notificações como lidas
  const markAsRead = () => {
    if (!uid) return;

    setUnreadMessages(0);
    setUnreadReviews(0);
    setLastMessageTime(new Date());
    setLastReviewTime(new Date());
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
