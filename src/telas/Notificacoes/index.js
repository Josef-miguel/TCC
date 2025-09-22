import React, { useEffect, useRef, useState, useContext } from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../../services/firebase';
import { collection, getDocs, onSnapshot, orderBy, query, where, doc, getDoc } from 'firebase/firestore';
import { ThemeContext } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';

export default function Notificacoes() {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const { markAsRead } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]); // [{ id, eventId, eventTitle, username, text, createdAt }]
  const [threads, setThreads] = useState([]); // conversas privadas a partir de 'chats'
  const unsubCommentsRefs = useRef([]);
  const chatsMapRef = useRef(new Map());
  const [userCache, setUserCache] = useState({});

  const uid = auth.currentUser?.uid || null;

  useEffect(() => {
    // Marcar notificações como lidas quando a tela for acessada
    markAsRead();

    if (!uid) {
      setLoading(false);
      return;
    }

    // Limpa listeners anteriores
    unsubCommentsRefs.current.forEach(un => un && typeof un === 'function' && un());
    unsubCommentsRefs.current = [];

    const fetchOwnedEventsAndSubscribe = async () => {
      try {
        const eventsRef = collection(db, 'events');

        const queries = [
          query(eventsRef, where('uid', '==', uid)),
          query(eventsRef, where('ownerId', '==', uid)),
          query(eventsRef, where('userId', '==', uid)),
        ];

        // creator.uid (nested) — pode não existir índice; envolvemos com try/catch
        try {
          queries.push(query(eventsRef, where('creator.uid', '==', uid)));
        } catch (e) {}

        // Executa todas as queries e agrega eventos por id
        const results = await Promise.all(
          queries.map(async (q) => {
            try {
              return await getDocs(q);
            } catch (e) {
              return null;
            }
          })
        );

        const eventMap = new Map();
        results.forEach((snap) => {
          if (!snap) return;
          snap.docs.forEach((d) => {
            const data = d.data() || {};
            eventMap.set(d.id, { id: d.id, title: data.title || 'Evento' });
          });
        });

        // Se não houver eventos do usuário, finaliza
        if (eventMap.size === 0) {
          setComments([]);
          setLoading(false);
          return;
        }

        // Inscreve em cada subcoleção 'avaliacoes' para capturar comentários em tempo real
        const unsubs = Array.from(eventMap.values()).map((evt) => {
          const q = query(
            collection(db, 'events', evt.id, 'avaliacoes'),
            orderBy('createdAt', 'desc')
          );
          return onSnapshot(q, (snap) => {
            const arr = snap.docs.map((doc) => {
              const d = doc.data() || {};
              return {
                id: doc.id,
                eventId: evt.id,
                eventTitle: evt.title,
                username: d.username || 'Usuário',
                text: d.comment_text || '',
                createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : (d.createdAt ? new Date(d.createdAt) : new Date(0)),
              };
            });
            // Merge comments por evento e reordenar globalmente
            setComments((prev) => {
              // remove antigos desse evento e concatena novos
              const next = prev.filter((c) => c.eventId !== evt.id).concat(arr);
              return next.sort((a, b) => b.createdAt - a.createdAt);
            });
            setLoading(false);
          }, () => setLoading(false));
        });

        unsubCommentsRefs.current = unsubs;
      } catch (e) {
        setLoading(false);
      }
    };

    fetchOwnedEventsAndSubscribe();

    return () => {
      unsubCommentsRefs.current.forEach(un => un && typeof un === 'function' && un());
      unsubCommentsRefs.current = [];
    };
  }, [uid]);

  // Conversas privadas a partir da coleção 'chats' usando participants (array-contains)
  useEffect(() => {
    if (!uid) return;

    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', uid));
    const unsub = onSnapshot(q, async (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const items = await Promise.all(docs.map(async (c) => {
        // otherUid é o outro participante que não é você
        const participants = Array.isArray(c.participants) ? c.participants : [];
        const otherUid = (participants.find(p => p && p !== uid)) || ((c.user_uid === uid) ? c.org_uid : c.user_uid);

        let username = userCache[otherUid]?.userInfo?.nome || userCache[otherUid]?.nome || 'Usuário';
        if (!userCache[otherUid] && otherUid) {
          try {
            const uSnap = await getDoc(doc(db, 'user', otherUid));
            if (uSnap.exists()) {
              const data = uSnap.data();
              setUserCache(prev => ({ ...prev, [otherUid]: data.userInfo ? { userInfo: data.userInfo } : data }));
              username = data?.userInfo?.nome || data?.nome || username;
            }
          } catch (e) {}
        }
        const ts = c.updated_at?.toDate ? c.updated_at.toDate() : (c.updated_at ? new Date(c.updated_at) : new Date(0));
        return {
          chatId: c.id,
          otherUid,
          username,
          lastText: c.last_message || '',
          lastTimestamp: ts,
        };
      }));
      items.sort((a, b) => (b.lastTimestamp - a.lastTimestamp));
      setThreads(items);
    });

    return () => unsub();
  }, [uid, userCache]);

  const renderCommentItem = ({ item }) => (
    <View style={[styles.item, { backgroundColor: theme?.backgroundSecondary, borderColor: theme?.border }]}>
      <View style={styles.itemIcon}>
        <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme?.primary} />
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, { color: theme?.textPrimary }]}>
          {item.username} comentou em {item.eventTitle}
        </Text>
        {item.text ? (
          <Text numberOfLines={2} style={[styles.itemSubtitle, { color: theme?.textSecondary }]}>
            "{item.text}"
          </Text>
        ) : null}
        <Text style={[styles.itemTime, { color: theme?.textTertiary }]}>
          {item.createdAt?.toLocaleString?.() || ''}
        </Text>
      </View>
    </View>
  );

  const renderThreadItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('Chat', { chatId: item.chatId, otherUid: item.otherUid })}
      style={[styles.item, { backgroundColor: theme?.backgroundSecondary, borderColor: theme?.border }]}
    >
      <View style={styles.itemIcon}>
        <Ionicons name="person-circle-outline" size={22} color={theme?.primary} />
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, { color: theme?.textPrimary }]}>
          Conversa com {item.username}
        </Text>
        {item.lastText ? (
          <Text numberOfLines={1} style={[styles.itemSubtitle, { color: theme?.textSecondary }]}>
            {item.lastText}
          </Text>
        ) : null}
        <Text style={[styles.itemTime, { color: theme?.textTertiary }]}>
          {item.lastTimestamp?.toLocaleString?.() || ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme?.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme?.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={theme?.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme?.primary }]}>Notificações</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <View style={styles.center}> 
          <ActivityIndicator size="large" color={theme?.primary} />
        </View>
      ) : (
        <>
          {/* Comentários em posts do usuário */}
          <Text style={[styles.sectionTitle, { color: theme?.textPrimary }]}>Comentários nos seus posts</Text>
          {comments.length === 0 ? (
            <Text style={[styles.empty, { color: theme?.textSecondary }]}>Sem comentários recentes.</Text>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => `${item.eventId}-${item.id}`}
              renderItem={renderCommentItem}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            />
          )}

          {/* Chats privados - usando threads do chat global como fallback */}
          <Text style={[styles.sectionTitle, { color: theme?.textPrimary, marginTop: 16 }]}>Chats privados</Text>
          {threads.length === 0 ? (
            <Text style={[styles.empty, { color: theme?.textSecondary }]}>Sem conversas recentes.</Text>
          ) : (
            <FlatList
              data={threads}
              keyExtractor={(item) => item.chatId}
              renderItem={renderThreadItem}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', paddingHorizontal: 16, marginBottom: 8 },
  empty: { paddingHorizontal: 16, marginBottom: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  itemIcon: { marginRight: 10 },
  itemContent: { flex: 1 },
  itemTitle: { fontWeight: '600', marginBottom: 4 },
  itemSubtitle: { fontSize: 13 },
  itemTime: { fontSize: 12, marginTop: 4 },
});
