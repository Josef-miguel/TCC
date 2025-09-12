import { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { auth, db } from '../../../services/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDoc, doc } from "firebase/firestore";
import { useAuth } from '../../../services/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../../context/ThemeContext';

export default function Chat() {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const { userData } = useAuth();
  const [userCache, setUserCache] = useState({}); // { uid: { userInfo, isOrganizer, uid } }
  const scrollViewRef = useRef();
  const fadeAnim = useRef(new Animated.Value(0)).current; // For fade-in animation

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('timestamp'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);

      // Verifica userIds sem username para buscar dados
      const missingIds = Array.from(new Set(msgs
        .map(m => m.userId)
        .filter(uid => uid && !userCache[uid]
      )));

      if (missingIds.length > 0) {
        // Busca perfis faltantes
        Promise.all(missingIds.map(async (uid) => {
          try {
            const ref = doc(db, 'user', uid);
            const snap = await getDoc(ref);
            if (snap.exists()) return { uid, ...snap.data() };
            return { uid, userInfo: {} };
          } catch (e) {
            return { uid, userInfo: {} };
          }
        })).then(results => {
          setUserCache(prev => {
            const next = { ...prev };
            results.forEach(r => { next[r.uid] = { userInfo: r.userInfo || r, uid: r.uid }; });
            return next;
          });
        });
      }
    });
    // Fade-in animation for messages
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    return () => unsubscribe();
  }, []);

  const sendMessage = async () => {
    if (!input) return;

    const uid = auth.currentUser?.uid;
    const username = userData?.userInfo?.nome || '';

    await addDoc(collection(db, 'messages'), {
      text: input,
      timestamp: serverTimestamp(),
      userId: uid,
      username: username,
    });

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
      <Text style={[styles.header, { color: theme?.primary }]}>Chat</Text>

      <ScrollView
        style={styles.messagesContainer}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => {
          const isOwn = msg.userId === auth.currentUser?.uid;
          const senderName = msg.username || (userCache[msg.userId]?.userInfo?.nome) || (isOwn ? 'Você' : 'Anônimo');
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
          placeholder="Digite sua mensagem..."
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