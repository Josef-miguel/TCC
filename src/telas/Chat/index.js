import { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Animated, Alert, Modal } from 'react-native';
import { auth, db } from '../../../services/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDoc, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { useAuth } from '../../../services/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ThemeContext } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

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
  
  // Estados para edição e exclusão de mensagens
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

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

  // Função para abrir menu de opções da mensagem
  const openMessageMenu = (message) => {
    setSelectedMessage(message);
    setShowMessageMenu(true);
  };

  // Função para fechar menu de opções da mensagem
  const closeMessageMenu = () => {
    setShowMessageMenu(false);
    setSelectedMessage(null);
  };

  // Função para iniciar edição de mensagem
  const startEditMessage = (message) => {
    setEditingMessage(message);
    setEditText(message.text);
    closeMessageMenu();
  };

  // Função para cancelar edição
  const cancelEdit = () => {
    setEditingMessage(null);
    setEditText('');
  };

  // Função para salvar edição da mensagem
  const saveEditMessage = async () => {
    if (!editText.trim() || !editingMessage) return;

    const makeChatId = (a, b) => {
      if (!a || !b) return null;
      return [a, b].sort().join('_');
    };

    const { chatId: chatIdParam, otherUid } = route.params || {};
    const myUid = auth.currentUser?.uid;
    const chatId = chatIdParam || makeChatId(myUid, otherUid);

    if (!chatId) {
      Alert.alert('Erro', 'Não foi possível identificar a conversa.');
      return;
    }

    try {
      const messageRef = doc(db, 'chats', chatId, 'messages', editingMessage.id);
      await updateDoc(messageRef, {
        text: editText.trim(),
        edited: true,
        editedAt: serverTimestamp()
      });

      // Atualizar metadados da conversa
      await updateDoc(doc(db, 'chats', chatId), { 
        updated_at: serverTimestamp(),
        last_message: editText.trim()
      });

      setEditingMessage(null);
      setEditText('');
      Alert.alert('Sucesso', 'Mensagem editada com sucesso!');
    } catch (error) {
      console.error('Erro ao editar mensagem:', error);
      Alert.alert('Erro', 'Não foi possível editar a mensagem.');
    }
  };

  // Função para excluir mensagem
  const deleteMessage = async (message) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta mensagem? Esta ação não pode ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const makeChatId = (a, b) => {
              if (!a || !b) return null;
              return [a, b].sort().join('_');
            };

            const { chatId: chatIdParam, otherUid } = route.params || {};
            const myUid = auth.currentUser?.uid;
            const chatId = chatIdParam || makeChatId(myUid, otherUid);

            if (!chatId) {
              Alert.alert('Erro', 'Não foi possível identificar a conversa.');
              return;
            }

            try {
              const messageRef = doc(db, 'chats', chatId, 'messages', message.id);
              await deleteDoc(messageRef);

              // Atualizar metadados da conversa
              await updateDoc(doc(db, 'chats', chatId), { 
                updated_at: serverTimestamp()
              });

              closeMessageMenu();
              Alert.alert('Sucesso', 'Mensagem excluída com sucesso!');
            } catch (error) {
              console.error('Erro ao excluir mensagem:', error);
              Alert.alert('Erro', 'Não foi possível excluir a mensagem.');
            }
          }
        }
      ]
    );
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
          const isEditing = editingMessage?.id === msg.id;
          
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
              
              {isEditing ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={[styles.editInput, { 
                      backgroundColor: theme?.background, 
                      color: theme?.textPrimary,
                      borderColor: theme?.primary 
                    }]}
                    value={editText}
                    onChangeText={setEditText}
                    multiline
                    autoFocus
                  />
                  <View style={styles.editButtons}>
                    <TouchableOpacity 
                      style={[styles.editButton, styles.saveButton, { backgroundColor: theme?.primary }]}
                      onPress={saveEditMessage}
                    >
                      <Ionicons name="checkmark" size={16} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.editButton, styles.cancelButton, { backgroundColor: theme?.textTertiary }]}
                      onPress={cancelEdit}
                    >
                      <Ionicons name="close" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.messageContent}>
                  <Text style={[
                    isOwn ? styles.messageText : styles.messageTextReceived,
                    { color: isOwn ? theme?.textInverted : theme?.textPrimary }
                  ]}>{msg.text}</Text>
                  {msg.edited && (
                    <Text style={[styles.editedLabel, { color: isOwn ? theme?.textInverted : theme?.textTertiary }]}>
                      (editado)
                    </Text>
                  )}
                  {isOwn && (
                    <TouchableOpacity 
                      style={styles.messageMenuButton}
                      onPress={() => openMessageMenu(msg)}
                    >
                      <Ionicons 
                        name="ellipsis-horizontal" 
                        size={16} 
                        color={isOwn ? theme?.textInverted : theme?.textTertiary} 
                      />
                    </TouchableOpacity>
                  )}
                </View>
              )}
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

      {/* Modal de Menu de Opções da Mensagem */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showMessageMenu}
        onRequestClose={closeMessageMenu}
      >
        <TouchableOpacity 
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={closeMessageMenu}
        >
          <View style={[styles.messageMenu, { backgroundColor: theme?.cardBackground }]}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => startEditMessage(selectedMessage)}
            >
              <Ionicons name="create-outline" size={20} color={theme?.textPrimary} />
              <Text style={[styles.menuItemText, { color: theme?.textPrimary }]}>
                Editar Mensagem
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.menuItem, styles.deleteMenuItem]}
              onPress={() => deleteMessage(selectedMessage)}
            >
              <Ionicons name="trash-outline" size={20} color="#ff4444" />
              <Text style={[styles.menuItemText, { color: '#ff4444' }]}>
                Excluir Mensagem
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={closeMessageMenu}
            >
              <Ionicons name="close-outline" size={20} color={theme?.textTertiary} />
              <Text style={[styles.menuItemText, { color: theme?.textTertiary }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    marginTop: 0,
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
  
  // Estilos para edição de mensagens
  editContainer: {
    width: '100%',
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    minHeight: 40,
    maxHeight: 100,
    marginBottom: 8,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  
  // Estilos para conteúdo da mensagem
  messageContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
  },
  editedLabel: {
    fontSize: 12,
    fontStyle: 'italic',
    marginLeft: 8,
    opacity: 0.7,
  },
  messageMenuButton: {
    padding: 4,
    marginLeft: 8,
  },
  
  // Estilos para menu de opções da mensagem
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageMenu: {
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  deleteMenuItem: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    marginTop: 0,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
});