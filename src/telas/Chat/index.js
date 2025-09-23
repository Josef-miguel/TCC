import { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Animated, Alert } from 'react-native';
import { auth, db } from '../../../services/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { useAuth } from '../../../services/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ThemeContext } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function Chat() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const { userData } = useAuth();
  const [userCache, setUserCache] = useState({}); // { uid: { userInfo, isOrganizer, uid } }
  const [otherUserName, setOtherUserName] = useState('Usuário');
  const scrollViewRef = useRef();
  const fadeAnim = useRef(new Animated.Value(0)).current; // For fade-in animation

  // Função para buscar o nome do usuário correspondente
  const fetchOtherUserName = async (otherUid) => {
    if (!otherUid) return;
    
    try {
      const userRef = doc(db, 'user', otherUid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const name = userData.nome || userData.userInfo?.nome || 'Usuário';
        setOtherUserName(name);
      }
    } catch (error) {
      console.error('Erro ao buscar nome do usuário:', error);
    }
  };

  useEffect(() => {
    const makeChatId = (a, b) => {
      if (!a || !b) return null;
      return [a, b].sort().join('_');
    };

    const { chatId: chatIdParam, otherUid } = route.params || {};
    const myUid = auth.currentUser?.uid;
    const chatId = chatIdParam || makeChatId(myUid, otherUid);

    console.log('Chat.useEffect - Debug Info:', {
      chatIdParam,
      otherUid,
      myUid,
      authCurrentUser: auth.currentUser,
      chatId,
      userData
    });

    if (!chatId) {
      console.error('Chat.useEffect: chatId is null/undefined. route.params:', route.params);
      return;
    }

    // Buscar nome do usuário correspondente
    if (otherUid) {
      fetchOtherUserName(otherUid);
    }

    let unsubscribe = () => {};

    (async () => {
      try {
        // Requer usuário autenticado
        if (!myUid) {
          console.error('Chat.useEffect: No myUid found. auth.currentUser:', auth.currentUser);
          try { Alert.alert('Atenção', 'Faça login para usar o chat.'); } catch (_) {}
          return;
        }

        // Garante existência do documento de chat com updated_at
        const chatRef = doc(db, 'chats', chatId);
        // Evita leitura antes da criação para não exigir permissão de GET
        const chatData = {
          user_uid: myUid || null,
          org_uid: otherUid || null,
          participants: [myUid, otherUid].filter(Boolean),
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        };

        console.log('Chat.useEffect: Attempting to create chat document:', chatId);
        console.log('Chat data to be written:', chatData);

        await setDoc(chatRef, chatData, { merge: true });
        console.log('Chat.useEffect: Chat document created/updated successfully');

        const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp'));
        console.log('Chat.useEffect: Attempting to read messages from:', `chats/${chatId}/messages`);

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            console.log('Chat.useEffect: onSnapshot callback triggered. Snapshot size:', snapshot.size);
            const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            console.log('Chat.useEffect: Messages received:', msgs);
            setMessages(msgs);

            const missingIds = Array.from(new Set(
              msgs.map(m => m.userId).filter(uid => uid && !userCache[uid])
            ));

            if (missingIds.length > 0) {
              console.log('Chat.useEffect: Fetching user data for uids:', missingIds);
              Promise.all(missingIds.map(async (uid) => {
                try {
                  const ref = doc(db, 'user', uid);
                  console.log('Chat.useEffect: Fetching user data for uid:', uid);
                  const snap = await getDoc(ref);
                  if (snap.exists()) {
                    console.log('Chat.useEffect: User data found for uid:', uid, snap.data());
                    return { uid, ...snap.data() };
                  }
                  console.log('Chat.useEffect: User data not found for uid:', uid);
                  return { uid, userInfo: {} };
                } catch (e) {
                  console.error('Error fetching user data for uid:', uid, e);
                  return { uid, userInfo: {} };
                }
              })).then(results => {
                console.log('Chat.useEffect: User cache updated with results:', results);
                setUserCache(prev => {
                  const next = { ...prev };
                  results.forEach(r => { next[r.uid] = { userInfo: r.userInfo || r, uid: r.uid }; });
                  return next;
                });
              });
            }
          },
          (err) => {
            console.error('Chat.onSnapshot messages error:', err?.code, err?.message, err);
            try { Alert.alert('Erro ao ler mensagens', `${err?.code || ''} ${err?.message || ''}`.trim()); } catch (_) {}
          }
        );
      } catch (e) {
        console.error('Chat.useEffect init error:', e?.code, e?.message);
        try { Alert.alert('Erro', 'Não foi possível preparar a conversa.'); } catch (_) {}
      }
    })();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    return () => unsubscribe();
  }, [route.params]);

  const sendMessage = async () => {
    if (!input) return;

    const makeChatId = (a, b) => {
      if (!a || !b) return null;
      return [a, b].sort().join('_');
    };

    // Requer usuário autenticado (não usar anônimo)
    if (!auth.currentUser) {
      console.error('sendMessage: auth.currentUser is null');
      Alert.alert('Atenção', 'Faça login para enviar mensagens.');
      return;
    }

    const uid = auth.currentUser?.uid;
    const username = userData?.userInfo?.nome || '';
    const { chatId: chatIdParam, otherUid } = route.params || {};
    const chatId = chatIdParam || makeChatId(uid, otherUid);

    console.log('sendMessage - Debug Info:', {
      input,
      uid,
      authCurrentUser: auth.currentUser,
      userData,
      chatIdParam,
      otherUid,
      chatId
    });

    if (!chatId) {
      console.error('sendMessage: chatId is null/undefined');
      return;
    }

    // Garante que o documento do chat exista e contenha ambos participantes (sem GET prévio)
    try {
      const chatRef = doc(db, 'chats', chatId);
      await setDoc(chatRef, {
        user_uid: uid || null,
        org_uid: otherUid || null,
        participants: [uid, otherUid].filter(Boolean),
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        last_message: input,
      }, { merge: true });
      console.log('sendMessage: Chat document ensured successfully');
    } catch (e) {
      console.error('Chat.sendMessage ensure chat error:', e?.code, e?.message);
      Alert.alert('Erro', 'Não foi possível iniciar a conversa.');
      return;
    }

    try {
      console.log('Chat.sendMessage -> chatId:', chatId, 'uid:', uid, 'otherUid:', otherUid);
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: input,
        timestamp: serverTimestamp(),
        userId: uid,
        username: username || 'Usuário',
      });
      console.log('sendMessage: Message added successfully');
    } catch (e) {
      console.error('Chat.sendMessage addDoc error:', e?.code, e?.message);
      Alert.alert('Erro ao enviar mensagem', `${e?.code || ''} ${e?.message || ''}`.trim());
      return;
    }

    // Atualiza metadados da conversa
    try {
      await updateDoc(doc(db, 'chats', chatId), { updated_at: serverTimestamp(), last_message: input });
      console.log('sendMessage: Chat document updated successfully');
    } catch (e) {
      console.warn('Chat.sendMessage updateDoc error, trying setDoc:', e?.code, e?.message);
      // Se o doc ainda não existir por algum motivo, cria-o
      try {
        await setDoc(doc(db, 'chats', chatId), {
          user_uid: uid || null,
          org_uid: otherUid || null,
          participants: [uid, otherUid].filter(Boolean),
          updated_at: serverTimestamp(),
          last_message: input,
        }, { merge: true });
        console.log('sendMessage: Chat document created via fallback');
      } catch (ee) {
        console.error('Chat.sendMessage setDoc fallback error:', ee?.code, ee?.message);
        Alert.alert('Erro ao atualizar conversa', `${ee?.code || ''} ${ee?.message || ''}`.trim());
      }
    }

    setInput('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme?.background }]}
    >
      <TouchableOpacity style={[styles.returnBtn, { backgroundColor: theme?.cardBackground }]} onPress={() => navigation.navigate('Home')}>
        <Text style={[styles.returnBtnText, { color: theme?.textPrimary }]}>Voltar</Text>
      </TouchableOpacity>
      <Text style={[styles.header, { color: theme?.primary }]}>{otherUserName}</Text>

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
          placeholder={t('Mande sua mensagem..')}
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
    elevation: 3, // Subtle shadow for depth
  },
  sent: {
    alignSelf: 'flex-end',
    borderTopRightRadius: 5, // Less rounded for a sleek look
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