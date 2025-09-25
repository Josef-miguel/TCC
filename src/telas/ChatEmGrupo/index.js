import { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Animated, Alert } from 'react-native';
import { auth, db } from '../../../services/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDoc, doc, setDoc, updateDoc, arrayUnion, where, getDocs } from "firebase/firestore";
import { useAuth } from '../../../services/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ThemeContext } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function ChatEmGrupo() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const { userData } = useAuth();
  const [userCache, setUserCache] = useState({}); // { uid: { userInfo, isOrganizer, uid } }
  const [groupName, setGroupName] = useState('Grupo');
  const [groupMembers, setGroupMembers] = useState([]);
  const [isMember, setIsMember] = useState(false);
  const scrollViewRef = useRef();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { eventId } = route.params || {};

  // Função para buscar informações do grupo e verificar se o usuário é membro
  const fetchGroupInfo = async () => {
    if (!eventId || !auth.currentUser) return;
    
    try {
      // Primeiro, verificar se o usuário participa da viagem através da coleção 'user'
      const userRef = doc(db, 'user', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        Alert.alert('Erro', 'Usuário não encontrado.');
        navigation.goBack();
        return;
      }
      
      const userData = userDoc.data();
      const joinedEvents = userData.joinedEvents || [];
      
      // Verificar se o usuário participa desta viagem
      if (!joinedEvents.includes(eventId)) {
        Alert.alert('Acesso negado', 'Você precisa participar da viagem para acessar o chat do grupo.');
        navigation.goBack();
        return;
      }
      
      // Se chegou até aqui, o usuário é membro
      setIsMember(true);
      
      // Buscar informações do evento para definir o nome do grupo
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        setGroupName(eventData.title || 'Chat da Viagem');
      } else {
        setGroupName('Chat da Viagem');
      }
      
      // Buscar todos os participantes da viagem
      const usersRef = collection(db, 'user');
      const q = query(usersRef, where('joinedEvents', 'array-contains', eventId));
      const querySnapshot = await getDocs(q);
      
      const membersList = [];
      querySnapshot.forEach((doc) => {
        membersList.push(doc.id);
      });
      
      setGroupMembers(membersList);
      
    } catch (error) {
      console.error('Erro ao buscar informações do grupo:', error);
      Alert.alert('Erro', 'Não foi possível carregar o chat do grupo.');
    }
  };


  useEffect(() => {
    if (!eventId) {
      console.error('ChatEmGrupo: eventId is required');
      Alert.alert('Erro', 'ID do evento não fornecido.');
      navigation.goBack();
      return;
    }

    // Buscar informações do grupo
    fetchGroupInfo();

    let unsubscribe = () => {};

    (async () => {
      try {
        // Requer usuário autenticado
        if (!auth.currentUser) {
          console.error('ChatEmGrupo: No authenticated user');
          Alert.alert('Atenção', 'Faça login para usar o chat.');
          return;
        }

        // Usar a mesma estrutura de chat que já funciona no projeto
        // Criar um chatId único para o grupo baseado no eventId
        const groupChatId = `group_${eventId}`;
        
        // Garantir que o documento de chat existe
        const chatRef = doc(db, 'chats', groupChatId);
        const chatData = {
          event_id: eventId,
          group_name: groupName,
          participants: groupMembers,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        };

        await setDoc(chatRef, chatData, { merge: true });
        console.log('ChatEmGrupo: Group chat document ensured successfully');

        // Escutar mensagens do grupo usando a estrutura de chat existente
        const messagesQuery = query(
          collection(db, 'chats', groupChatId, 'messages'), 
          orderBy('timestamp')
        );
        
        unsubscribe = onSnapshot(
          messagesQuery,
          (snapshot) => {
            console.log('ChatEmGrupo: Messages received:', snapshot.size);
            const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setMessages(msgs);

            // Buscar dados dos usuários que enviaram mensagens
            const missingIds = Array.from(new Set(
              msgs.map(m => m.userId).filter(uid => uid && !userCache[uid])
            ));

            if (missingIds.length > 0) {
              Promise.all(missingIds.map(async (uid) => {
                try {
                  const ref = doc(db, 'user', uid);
                  const snap = await getDoc(ref);
                  if (snap.exists()) {
                    return { uid, ...snap.data() };
                  }
                  return { uid, userInfo: {} };
                } catch (e) {
                  console.error('Error fetching user data for uid:', uid, e);
                  return { uid, userInfo: {} };
                }
              })).then(results => {
                setUserCache(prev => {
                  const next = { ...prev };
                  results.forEach(r => { 
                    next[r.uid] = { userInfo: r.userInfo || r, uid: r.uid }; 
                  });
                  return next;
                });
              });
            }
          },
          (err) => {
            console.error('ChatEmGrupo.onSnapshot messages error:', err);
            Alert.alert('Erro ao ler mensagens', `${err?.code || ''} ${err?.message || ''}`.trim());
          }
        );
      } catch (e) {
        console.error('ChatEmGrupo.useEffect init error:', e);
        Alert.alert('Erro', 'Não foi possível preparar o chat do grupo.');
      }
    })();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    return () => unsubscribe();
  }, [eventId]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Requer usuário autenticado
    if (!auth.currentUser) {
      Alert.alert('Atenção', 'Faça login para enviar mensagens.');
      return;
    }

    const uid = auth.currentUser.uid;
    const username = userData?.userInfo?.nome || 'Usuário';

    try {
      // Usar a mesma estrutura de chat que já funciona
      const groupChatId = `group_${eventId}`;
      
      // Garantir que o documento do chat existe
      const chatRef = doc(db, 'chats', groupChatId);
      await setDoc(chatRef, {
        event_id: eventId,
        group_name: groupName,
        participants: groupMembers,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        last_message: input.trim(),
      }, { merge: true });
      
      // Adicionar mensagem
      await addDoc(collection(db, 'chats', groupChatId, 'messages'), {
        text: input.trim(),
        timestamp: serverTimestamp(),
        userId: uid,
        username: username,
      });
      
      console.log('ChatEmGrupo: Message sent successfully');
    } catch (e) {
      console.error('ChatEmGrupo.sendMessage error:', e);
      Alert.alert('Erro ao enviar mensagem', `${e?.code || ''} ${e?.message || ''}`.trim());
      return;
    }

    setInput('');
  };

  if (!isMember) {
    return (
      <View style={[styles.container, { backgroundColor: theme?.background }]}>
        <TouchableOpacity style={[styles.returnBtn, { backgroundColor: theme?.cardBackground }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.returnBtnText, { color: theme?.textPrimary }]}>Voltar</Text>
        </TouchableOpacity>
        <Text style={[styles.header, { color: theme?.textPrimary }]}>Acesso Negado</Text>
        <Text style={[styles.message, { color: theme?.textSecondary }]}>
          Você precisa participar da viagem para acessar o chat do grupo.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme?.background }]}
    >
      <TouchableOpacity style={[styles.returnBtn, { backgroundColor: theme?.cardBackground }]} onPress={() => navigation.goBack()}>
        <Text style={[styles.returnBtnText, { color: theme?.textPrimary }]}>Voltar</Text>
      </TouchableOpacity>
      <Text style={[styles.header, { color: theme?.primary }]}>{groupName}</Text>
      <Text style={[styles.memberCount, { color: theme?.textSecondary }]}>
        {groupMembers.length} membro{groupMembers.length !== 1 ? 's' : ''}
      </Text>

      <ScrollView
        style={styles.messagesContainer}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => {
          const isOwn = msg.userId === auth.currentUser?.uid;
          const senderName = msg.username || (userCache[msg.userId]?.userInfo?.nome) || (isOwn ? t('chat.you') : t('chat.anonymous'));
          return (
            <Animated.View
              key={msg.id}
              style={[
                styles.messageBubble,
                isOwn ? [styles.sent, { backgroundColor: theme?.primary }] : [styles.received, { backgroundColor: theme?.cardBackground, borderColor: theme?.primary }],
                { opacity: fadeAnim }
              ]}
            >
              {!isOwn && <Text style={[styles.senderName, { color: theme?.textSecondary }]}>{senderName}</Text>}
              <Text style={[
                isOwn ? styles.messageText : styles.messageTextReceived,
                { color: isOwn ? theme?.textInverted : theme?.textPrimary }
              ]}>{msg.text}</Text>
            </Animated.View>
          );
        })}
      </ScrollView>

      <View style={[styles.inputContainer, { backgroundColor: theme?.backgroundSecondary, borderTopColor: theme?.primary }]}>
        <TextInput
          placeholder={t('chat.typeMessage')}
          placeholderTextColor={theme?.textTertiary}
          value={input}
          onChangeText={setInput}
          style={[styles.input, { backgroundColor: theme?.background, color: theme?.textPrimary }]}
        />
        <TouchableOpacity style={[styles.sendButton, { backgroundColor: theme?.primary }]} onPress={sendMessage}>
          <Text style={[styles.sendButtonText, { color: theme?.textInverted }]}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  header: {
    marginVertical: 20,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  memberCount: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  messagesContainer: {
    flex: 1,
    marginVertical: 10,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    marginVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sent: {
    alignSelf: 'flex-end',
    borderTopRightRadius: 5,
  },
  received: {
    alignSelf: 'flex-start',
    borderTopLeftRadius: 5,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTextReceived: {
    fontSize: 16,
    lineHeight: 22,
  },
  senderName: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    borderRadius: 50,
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  sendButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  returnBtn: {
    marginTop: 40,
    width: 80,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  returnBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
