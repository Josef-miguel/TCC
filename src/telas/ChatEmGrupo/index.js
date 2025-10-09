import { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Animated, Alert, Modal } from 'react-native';
import { auth, db } from '../../../services/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDoc, doc, setDoc, updateDoc, arrayUnion, where, getDocs, deleteDoc } from "firebase/firestore";
import { useAuth } from '../../../services/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ThemeContext } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

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
  
  // Estados para edição e exclusão de mensagens
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Log para verificar mudanças no estado das mensagens
  useEffect(() => {
    console.log('ChatEmGrupo: Estado de mensagens atualizado:', messages.length, 'mensagens');
    console.log('ChatEmGrupo: Conteúdo das mensagens:', messages);
  }, [messages]);

  const { eventId } = route.params || {};

  // Função para forçar a atualização do cache de usuários
  const refreshUserCache = async () => {
    if (!auth.currentUser || !userData) return;
    
    try {
      const userRef = doc(db, 'user', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userDataFromFirestore = userDoc.data();
        let nome = 'Você';
        if (userDataFromFirestore.nome) {
          nome = userDataFromFirestore.nome;
        }
        
        console.log('ChatEmGrupo: Atualizando cache do usuário atual:', nome);
        
        setUserCache(prev => ({
          ...prev,
          [auth.currentUser.uid]: {
            uid: auth.currentUser.uid,
            userInfo: userDataFromFirestore,
            nome: nome
          }
        }));
      }
    } catch (error) {
      console.error('ChatEmGrupo: Erro ao atualizar cache do usuário:', error);
    }
  };

  // Função para sincronizar membros do grupo com participantes do evento
  const syncGroupMembers = async (eventId) => {
    try {
      console.log('ChatEmGrupo: Sincronizando membros do grupo para evento:', eventId);
      
      // Buscar todos os usuários que participam deste evento
      const usersRef = collection(db, 'user');
      const q = query(usersRef, where('joinedEvents', 'array-contains', eventId));
      const querySnapshot = await getDocs(q);
      
      const participantIds = [];
      querySnapshot.forEach((doc) => {
        participantIds.push(doc.id);
      });
      
      console.log('ChatEmGrupo: Participantes encontrados:', participantIds);
      
      // Atualizar o documento do grupo com os participantes
      const groupChatId = `group_${eventId}`;
      const groupRef = doc(db, 'chat-group', groupChatId);
      
      await updateDoc(groupRef, {
        members: participantIds,
        updated_at: serverTimestamp()
      });
      
      console.log('ChatEmGrupo: Membros do grupo sincronizados com sucesso');
      return participantIds;
      
    } catch (error) {
      console.error('ChatEmGrupo: Erro ao sincronizar membros do grupo:', error);
      return [];
    }
  };

  // Função para buscar informações do grupo e verificar se o usuário é membro
  const fetchGroupInfo = async () => {
    if (!eventId) {
      console.error('ChatEmGrupo: eventId não fornecido');
      Alert.alert('Erro', 'ID do evento não fornecido.');
      navigation.goBack();
      return;
    }

    if (!auth.currentUser) {
      console.error('ChatEmGrupo: Usuário não autenticado');
      Alert.alert('Erro', 'Usuário não autenticado. Faça login novamente.');
      navigation.goBack();
      return;
    }

    console.log('ChatEmGrupo: Usuário autenticado:', auth.currentUser.uid);
    console.log('ChatEmGrupo: EventId:', eventId);
    
    try {
      // Buscar o documento do grupo na coleção chat-group (estrutura correta)
      const groupChatId = `group_${eventId}`;
      const groupRef = doc(db, 'chat-group', groupChatId);
      console.log('ChatEmGrupo: Tentando acessar documento do grupo:', groupRef.path);
      
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        console.log('ChatEmGrupo: Documento do grupo não existe, criando...');
        // Criar o documento do grupo se não existir
        await setDoc(groupRef, {
          group_name: 'Chat da Viagem',
          id_org: auth.currentUser.uid,
          members: [auth.currentUser.uid],
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
        console.log('ChatEmGrupo: Documento do grupo criado com sucesso');
      } else {
        console.log('ChatEmGrupo: Documento do grupo já existe');
        // Sincronizar membros do grupo com participantes do evento
        await syncGroupMembers(eventId);
      }
      
      // Verificar se conseguimos acessar a sub-coleção messages
      try {
        const messagesRef = collection(db, 'chat-group', groupChatId, 'messages');
        console.log('ChatEmGrupo: Testando acesso à sub-coleção messages:', messagesRef.path);
        
        // Buscar TODAS as mensagens da sub-coleção sem filtros
        console.log('ChatEmGrupo: Buscando TODAS as mensagens da sub-coleção...');
        const allMessagesSnapshot = await getDocs(messagesRef);
        console.log('ChatEmGrupo: Total de mensagens na sub-coleção:', allMessagesSnapshot.size);
        
        if (allMessagesSnapshot.size > 0) {
          console.log('ChatEmGrupo: === DETALHES COMPLETOS DA SUB-COLEÇÃO MESSAGES ===');
          allMessagesSnapshot.docs.forEach((doc, index) => {
            const messageData = doc.data();
            console.log(`ChatEmGrupo: Mensagem ${index + 1}:`, {
              id: doc.id,
              ...messageData,
              timestampType: typeof messageData.timestamp,
              createdAtType: typeof messageData.createdAt,
              dateType: typeof messageData.date
            });
          });
          console.log('ChatEmGrupo: === FIM DOS DETALHES DA SUB-COLEÇÃO ===');
        } else {
          console.log('ChatEmGrupo: Sub-coleção messages está VAZIA');
        }
        
        // Tentar fazer uma query simples para verificar se a sub-coleção existe
        const testQuery = query(messagesRef, orderBy('timestamp'));
        console.log('ChatEmGrupo: Query da sub-coleção criada com sucesso');
        
        // Tentar buscar mensagens existentes
        const existingMessages = await getDocs(testQuery);
        console.log('ChatEmGrupo: Mensagens existentes encontradas:', existingMessages.size);
        
        if (existingMessages.size > 0) {
          console.log('ChatEmGrupo: Dados das mensagens existentes:', existingMessages.docs.map(d => ({ id: d.id, ...d.data() })));
        } else {
          // Tentar buscar sem ordenação
          console.log('ChatEmGrupo: Nenhuma mensagem encontrada com ordenação, tentando sem ordenação...');
          const messagesWithoutOrder = await getDocs(collection(db, 'chat-group', groupChatId, 'messages'));
          console.log('ChatEmGrupo: Mensagens sem ordenação:', messagesWithoutOrder.size);
          
          if (messagesWithoutOrder.size > 0) {
            console.log('ChatEmGrupo: Dados das mensagens sem ordenação:', messagesWithoutOrder.docs.map(d => ({ id: d.id, ...d.data() })));
          }
        }
      } catch (error) {
        console.error('ChatEmGrupo: Erro ao acessar sub-coleção messages:', error);
      }
      
      const groupData = groupDoc.data();
      
      // Verificar se o usuário é membro do grupo OU participa do evento
      const members = groupData?.members || [];
      const isGroupMember = members.includes(auth.currentUser.uid);
      
      // Verificar se o usuário participa do evento
      let isEventParticipant = false;
      try {
        const userRef = doc(db, 'user', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const joinedEvents = userData.joinedEvents || [];
          isEventParticipant = joinedEvents.includes(eventId);
        }
      } catch (error) {
        console.error('ChatEmGrupo: Erro ao verificar participação no evento:', error);
      }
      
      console.log('ChatEmGrupo: Verificação de acesso:');
      console.log('- É membro do grupo:', isGroupMember);
      console.log('- Participa do evento:', isEventParticipant);
      console.log('- Membros do grupo:', members);
      
      if (!isGroupMember && !isEventParticipant) {
        Alert.alert(
          'Acesso negado', 
          'Você precisa participar da viagem para acessar o chat do grupo.'
        );
        navigation.goBack();
        return;
      }
      
      // Se o usuário participa do evento mas não é membro do grupo, sincronizar
      if (isEventParticipant && !isGroupMember) {
        console.log('ChatEmGrupo: Usuário participa do evento mas não é membro do grupo, sincronizando...');
        await syncGroupMembers(eventId);
      }
      
      setIsMember(true);
      
      // Definir nome do grupo
      setGroupName(groupData?.group_name || 'Chat da Viagem');
      
      // Definir lista de membros (usar membros sincronizados se disponível)
      const finalMembers = isEventParticipant && !isGroupMember ? 
        await syncGroupMembers(eventId) : members;
      setGroupMembers(finalMembers || members);
      
    } catch (error) {
      console.error('ChatEmGrupo: Erro ao buscar informações do grupo:', error);
      console.error('ChatEmGrupo: Código do erro:', error?.code);
      console.error('ChatEmGrupo: Mensagem do erro:', error?.message);
      console.error('ChatEmGrupo: Detalhes completos do erro:', error);
      
      // Tratamento específico para diferentes tipos de erro
      if (error?.code === 'permission-denied') {
        Alert.alert(
          'Erro de Permissão', 
          'Você não tem permissão para acessar este chat. Verifique se você é membro do grupo.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else if (error?.code === 'unauthenticated') {
        Alert.alert(
          'Erro de Autenticação', 
          'Sua sessão expirou. Faça login novamente.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else {
        Alert.alert(
          'Erro ao Carregar Chat', 
          `Não foi possível carregar o chat do grupo: ${error?.message || 'Erro desconhecido'}`,
          [
            {
              text: 'Tentar Novamente',
              onPress: () => {
                // Tentar novamente após um pequeno delay
                setTimeout(() => {
                  fetchGroupInfo();
                }, 1000);
              }
            },
            {
              text: 'Voltar',
              style: 'cancel',
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
    }
  };


  useEffect(() => {
    if (!eventId) {
      Alert.alert('Erro', 'ID do evento não fornecido.');
      navigation.goBack();
      return;
    }

    // Atualizar cache do usuário atual
    refreshUserCache();

    // Buscar informações do grupo
    fetchGroupInfo();

    let unsubscribe = () => {};

    (async () => {
      try {
        // Requer usuário autenticado
        if (!auth.currentUser) {
          Alert.alert('Atenção', 'Faça login para usar o chat.');
          return;
        }

        // Usar a estrutura correta: chat-group/group_(eventId)/messages
        const groupChatId = `group_${eventId}`;
        
        console.log('ChatEmGrupo: Tentando acessar sub-coleção messages para:', groupChatId);

        // Escutar mensagens do grupo na sub-coleção messages
        // Tentar diferentes campos de ordenação
        let messagesQuery;
        try {
          messagesQuery = query(
            collection(db, 'chat-group', groupChatId, 'messages'), 
            orderBy('timestamp')
          );
          console.log('ChatEmGrupo: Query com timestamp criada com sucesso');
        } catch (error) {
          console.log('ChatEmGrupo: Erro com timestamp, tentando createdAt:', error);
          try {
            messagesQuery = query(
              collection(db, 'chat-group', groupChatId, 'messages'), 
              orderBy('createdAt')
            );
            console.log('ChatEmGrupo: Query com createdAt criada com sucesso');
          } catch (error2) {
            console.log('ChatEmGrupo: Erro com createdAt, tentando sem ordenação:', error2);
            messagesQuery = query(collection(db, 'chat-group', groupChatId, 'messages'));
            console.log('ChatEmGrupo: Query sem ordenação criada');
          }
        }
        
        unsubscribe = onSnapshot(
          messagesQuery,
          (snapshot) => {
            console.log('ChatEmGrupo: === ON SNAPSHOT TRIGGERED ===');
            console.log('ChatEmGrupo: Mensagens recebidas da sub-coleção:', snapshot.size);
            console.log('ChatEmGrupo: Snapshot docs:', snapshot.docs);
            
            const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            console.log('ChatEmGrupo: Dados das mensagens processadas:', msgs);
            
            // Verificar estrutura das mensagens
            if (msgs.length > 0) {
              console.log('ChatEmGrupo: Estrutura da primeira mensagem:', msgs[0]);
              console.log('ChatEmGrupo: Campos disponíveis:', Object.keys(msgs[0]));
              console.log('ChatEmGrupo: Tipo de timestamp:', typeof msgs[0].timestamp);
              console.log('ChatEmGrupo: Valor do timestamp:', msgs[0].timestamp);
            } else {
              console.log('ChatEmGrupo: NENHUMA MENSAGEM ENCONTRADA!');
            }
            
            console.log('ChatEmGrupo: Definindo mensagens no estado...');
            setMessages(msgs);
            console.log('ChatEmGrupo: Estado de mensagens atualizado');

            // Buscar dados dos usuários que enviaram mensagens
            const missingIds = Array.from(new Set(
              msgs.map(m => m.userId).filter(uid => uid && !userCache[uid])
            ));

            if (missingIds.length > 0) {
              console.log('ChatEmGrupo: Buscando dados de usuários:', missingIds);
              Promise.all(missingIds.map(async (uid) => {
                try {
                  const ref = doc(db, 'user', uid);
                  const snap = await getDoc(ref);
                  if (snap.exists()) {
                    const userData = snap.data();
                    console.log(`ChatEmGrupo: Dados do usuário ${uid}:`, userData);
                    
                    // Extrair o nome de diferentes possíveis estruturas
                    let nome = 'Usuário';
                    if (userData.nome) {
                      nome = userData.nome;
                    } else if (userData.userInfo?.nome) {
                      nome = userData.userInfo.nome;
                    }
                    
                    console.log(`ChatEmGrupo: Nome extraído para ${uid}:`, nome);
                    
                    return { 
                      uid, 
                      userInfo: userData,
                      nome: nome
                    };
                  }
                  console.warn(`ChatEmGrupo: Usuário ${uid} não encontrado no Firestore`);
                  return { uid, userInfo: {}, nome: 'Usuário Desconhecido' };
                } catch (e) {
                  console.error('Error fetching user data for uid:', uid, e);
                  return { uid, userInfo: {}, nome: 'Usuário Desconhecido' };
                }
              })).then(results => {
                setUserCache(prev => {
                  const next = { ...prev };
                  results.forEach(r => { 
                    next[r.uid] = { 
                      userInfo: r.userInfo || r, 
                      uid: r.uid,
                      nome: r.nome
                    }; 
                  });
                  return next;
                });
              });
            }
          },
          (err) => {
            console.error('ChatEmGrupo: Erro ao ler mensagens:', err);
            console.error('ChatEmGrupo: Código do erro:', err?.code);
            console.error('ChatEmGrupo: Mensagem do erro:', err?.message);
            console.error('ChatEmGrupo: Detalhes completos do erro:', err);
            
            // Tratamento específico para diferentes tipos de erro
            if (err?.code === 'permission-denied') {
              Alert.alert(
                'Erro de Permissão', 
                'Você não tem permissão para acessar este chat. Verifique se você é membro do grupo.',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack()
                  }
                ]
              );
            } else if (err?.code === 'unauthenticated') {
              Alert.alert(
                'Erro de Autenticação', 
                'Sua sessão expirou. Faça login novamente.',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.navigate('Login')
                  }
                ]
              );
            } else {
              Alert.alert(
                'Erro ao Carregar Chat', 
                `Não foi possível carregar as mensagens: ${err?.message || 'Erro desconhecido'}`,
                [
                  {
                    text: 'Tentar Novamente',
                    onPress: () => {
                      // Recarregar o componente
                      fetchGroupInfo();
                    }
                  },
                  {
                    text: 'Voltar',
                    style: 'cancel',
                    onPress: () => navigation.goBack()
                  }
                ]
              );
            }
          }
        );
      } catch (e) {
        console.error('Erro ao preparar o chat do grupo:', e);
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
    // Obter o nome do usuário de forma mais robusta
    let username = 'Usuário';
    if (userData?.userInfo?.nome) {
      username = userData.userInfo.nome;
    } else if (userData?.nome) {
      username = userData.nome;
    }
    
    console.log('ChatEmGrupo: Enviando mensagem como:', username);
    console.log('ChatEmGrupo: Dados do usuário:', userData);
    console.log('ChatEmGrupo: userInfo:', userData?.userInfo);

    try {
      // Usar a estrutura correta: chat-group/group_(eventId)/messages
      const groupChatId = `group_${eventId}`;
      
      console.log('ChatEmGrupo: Enviando mensagem para sub-coleção:', groupChatId);
      
      // Atualizar documento do grupo com última mensagem
      const groupRef = doc(db, 'chat-group', groupChatId);
      await updateDoc(groupRef, {
        updated_at: serverTimestamp(),
        last_message: input.trim(),
      });
      
      // Adicionar mensagem na sub-coleção messages
      const messageRef = collection(db, 'chat-group', groupChatId, 'messages');
      console.log('ChatEmGrupo: Adicionando mensagem na sub-coleção:', messageRef.path);
      
      await addDoc(messageRef, {
        text: input.trim(),
        timestamp: serverTimestamp(),
        userId: uid,
        username: username,
      });
      
      console.log('ChatEmGrupo: Mensagem enviada com sucesso para sub-coleção');
      
    } catch (e) {
      console.error('Erro ao enviar mensagem:', e);
      Alert.alert('Erro ao enviar mensagem', `${e?.code || ''} ${e?.message || ''}`.trim());
      return;
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

    try {
      const groupChatId = `group_${eventId}`;
      const messageRef = doc(db, 'chat-group', groupChatId, 'messages', editingMessage.id);
      
      await updateDoc(messageRef, {
        text: editText.trim(),
        edited: true,
        editedAt: serverTimestamp()
      });

      // Atualizar metadados do grupo
      await updateDoc(doc(db, 'chat-group', groupChatId), { 
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
            try {
              const groupChatId = `group_${eventId}`;
              const messageRef = doc(db, 'chat-group', groupChatId, 'messages', message.id);
              
              await deleteDoc(messageRef);

              // Atualizar metadados do grupo
              await updateDoc(doc(db, 'chat-group', groupChatId), { 
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

  console.log('ChatEmGrupo: Renderizando componente com', messages.length, 'mensagens');
  console.log('ChatEmGrupo: isMember:', isMember);
  console.log('ChatEmGrupo: groupName:', groupName);

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
        {messages.length > 0 ? (
          messages.map((msg, index) => {
            console.log(`ChatEmGrupo: Renderizando mensagem ${index + 1}:`, msg);
            const isOwn = msg.userId === auth.currentUser?.uid;
            
            // Lógica melhorada para obter o nome do remetente
            let senderName = 'Usuário';
            
            if (isOwn) {
              // Para mensagens próprias, usar dados do usuário atual
              senderName = userData?.userInfo?.nome || userData?.nome || 'Você';
              console.log('ChatEmGrupo: Nome próprio encontrado:', senderName, 'de userData:', userData);
            } else {
              // Para mensagens de outros usuários, buscar no cache ou usar username da mensagem
              const cachedUser = userCache[msg.userId];
              console.log('ChatEmGrupo: Cache do usuário:', cachedUser);
              
              if (cachedUser?.nome) {
                senderName = cachedUser.nome;
              } else if (cachedUser?.userInfo?.nome) {
                senderName = cachedUser.userInfo.nome;
              } else if (cachedUser?.userInfo) {
                // O userInfo pode conter o nome diretamente
                senderName = cachedUser.userInfo.nome || 'Usuário';
              } else if (msg.username) {
                senderName = msg.username;
              } else {
                senderName = 'Usuário';
              }
            }
            
            console.log(`ChatEmGrupo: Nome do remetente para mensagem ${index + 1}:`, senderName);
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
              <Text style={[styles.senderName, { color: theme?.textSecondary }]}>{senderName}</Text>
              
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
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme?.textSecondary }]}>
              Nenhuma mensagem encontrada
            </Text>
            <Text style={[styles.emptySubtext, { color: theme?.textTertiary }]}>
              Seja o primeiro a enviar uma mensagem!
            </Text>
          </View>
        )}
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
  memberCount: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 0,
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
  
  // Estilos para container vazio
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
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
