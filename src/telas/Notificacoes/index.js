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
  const { markAsRead, unreadMessages, unreadReviews } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]); // [{ id, eventId, eventTitle, username, text, createdAt }]
  const [threads, setThreads] = useState([]); // conversas privadas a partir de 'chats'
  const unsubCommentsRefs = useRef([]);
  const chatsMapRef = useRef(new Map());
  const [userCache, setUserCache] = useState({});

  const uid = auth.currentUser?.uid || null;

  useEffect(() => {
    // Não marcar como lidas ao abrir; exibiremos os contadores
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

  // Marca como lidas ao sair da tela
  useEffect(() => {
    return () => {
      try { markAsRead(); } catch (_) {}
    };
  }, []);

  // Conversas privadas a partir da coleção 'chats' - versão robusta
  useEffect(() => {
    if (!uid) {
      return;
    }
    
    // Função para buscar todos os chats e filtrar localmente
    const fetchAllChats = async () => {
      try {
        // Buscar todos os chats (individuais e de grupo) na coleção 'chats'
        const chatsRef = collection(db, 'chats');
        const chatsSnapshot = await getDocs(chatsRef);
        
        const allChats = chatsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        
        console.log('Notificacoes: Todos os chats encontrados:', allChats.length);
        console.log('Notificacoes: Dados dos chats:', allChats);
        console.log('Notificacoes: UID do usuário atual:', uid);
        
        // Filtrar chats onde o usuário atual é participante
        const userChats = allChats.filter(chat => {
          // Verificar diferentes estruturas de dados
          const participants = Array.isArray(chat.participants) ? chat.participants : [];
          const userUid = chat.user_uid;
          const orgUid = chat.org_uid;
          
          console.log('Notificacoes: Verificando chat:', chat.id, {
            participants,
            userUid,
            orgUid,
            currentUid: uid
          });
          
          // Para chats individuais e de grupo (ambos na coleção 'chats')
          // Verificar múltiplas estruturas possíveis
          const isParticipant = 
            participants.includes(uid) || 
            userUid === uid || 
            orgUid === uid ||
            chat.uid === uid || // Estrutura alternativa
            chat.creatorId === uid || // Estrutura alternativa
            chat.creatorUid === uid; // Estrutura alternativa
          
          console.log('Notificacoes: É participante?', isParticipant);
          
          return isParticipant;
        });
        
        console.log('Notificacoes: Chats filtrados para o usuário:', userChats.length);
        
        // Processar cada chat
        const items = await Promise.all(userChats.map(async (c) => {
          const isGroupChat = c.id.startsWith('group_');
          let otherUid = null;
          let username = 'Usuário';
          
          if (isGroupChat) {
            // Para chats de grupo
            username = c.group_name || 'Chat do Grupo';
            otherUid = c.event_id; // Usar eventId como identificador
          } else {
            // Para chats individuais
            const participants = Array.isArray(c.participants) ? c.participants : [];
            
            if (participants.length > 0) {
              otherUid = participants.find(p => p && p !== uid);
            } else {
              // Fallback para diferentes estruturas antigas
              if (c.user_uid === uid) {
                otherUid = c.org_uid;
              } else if (c.org_uid === uid) {
                otherUid = c.user_uid;
              } else if (c.uid === uid) {
                otherUid = c.creatorId || c.creatorUid;
              } else {
                otherUid = c.user_uid || c.org_uid || c.uid;
              }
            }

            if (otherUid) {
              // Verificar cache primeiro
              if (userCache[otherUid]) {
                username = userCache[otherUid]?.userInfo?.nome || userCache[otherUid]?.nome || 'Usuário';
              } else {
                // Buscar dados do usuário
                try {
                  const uSnap = await getDoc(doc(db, 'user', otherUid));
                  if (uSnap.exists()) {
                    const data = uSnap.data();
                    const userInfo = data.userInfo ? { userInfo: data.userInfo } : data;
                    setUserCache(prev => ({ ...prev, [otherUid]: userInfo }));
                    username = data?.userInfo?.nome || data?.nome || 'Usuário';
                  }
                } catch (e) {
                  console.error('Erro ao buscar dados do usuário:', e);
                }
              }
            }
          }
          
          const ts = c.updated_at?.toDate ? c.updated_at.toDate() : (c.updated_at ? new Date(c.updated_at) : new Date(0));
          const item = {
            chatId: c.id,
            otherUid,
            username,
            lastText: c.last_message || '',
            lastTimestamp: ts,
            isGroupChat,
            eventId: c.event_id,
          };
          
          return item;
        }));
        
        items.sort((a, b) => (b.lastTimestamp - a.lastTimestamp));
        setThreads(items);
        
      } catch (error) {
        console.error('Erro ao buscar chats:', error);
        setThreads([]);
      }
    };
    
    // Executar busca inicial
    fetchAllChats();
    
    // Configurar listener para mudanças em tempo real
    const chatsRef = collection(db, 'chats');
    
    const unsub = onSnapshot(chatsRef, (snapshot) => {
      fetchAllChats(); // Re-executar busca quando há mudanças
    }, (error) => {
      console.error('Erro no listener de chats:', error);
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
      onPress={() => {
        if (item.isGroupChat) {
          navigation.navigate('ChatEmGrupo', { eventId: item.eventId });
        } else {
          navigation.navigate('Chat', { chatId: item.chatId, otherUid: item.otherUid });
        }
      }}
      style={[styles.item, { backgroundColor: theme?.backgroundSecondary, borderColor: theme?.border }]}
    >
      <View style={styles.itemIcon}>
        <Ionicons 
          name={item.isGroupChat ? "people-circle-outline" : "person-circle-outline"} 
          size={22} 
          color={theme?.primary} 
        />
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, { color: theme?.textPrimary }]}>
          {item.isGroupChat ? item.username : `Conversa com ${item.username}`}
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
          <Text style={[styles.sectionTitle, { color: theme?.textPrimary }]}>{}
            {`Comentários nos seus posts ${unreadReviews > 0 ? `(${unreadReviews} nova${unreadReviews > 1 ? 's' : ''})` : ''}`}
          </Text>
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
          <Text style={[styles.sectionTitle, { color: theme?.textPrimary, marginTop: 0 }]}>{}
            {`Chats privados ${unreadMessages > 0 ? `(${unreadMessages} nova${unreadMessages > 1 ? 's' : ''})` : ''}`}
          </Text>
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
  itemTime: { fontSize: 12, marginTop: 0 },
});
