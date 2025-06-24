import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { db } from '../../../services/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { useNavigation } from '@react-navigation/native';

export default function Chat() {
  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const scrollViewRef = useRef();
  const fadeAnim = useRef(new Animated.Value(0)).current; // For fade-in animation

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('timestamp'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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

    await addDoc(collection(db, 'messages'), {
      text: input,
      timestamp: serverTimestamp()
    });

    setInput('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <TouchableOpacity style={styles.returnBtn} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.returnBtnText}>Voltar</Text>
      </TouchableOpacity>
      <Text style={styles.header}>Chat</Text>

      <ScrollView
        style={styles.messagesContainer}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, index) => (
          <Animated.View
            key={msg.id}
            style={[
              styles.messageBubble,
              index % 2 === 0 ? styles.sent : styles.received,
              { opacity: fadeAnim }
            ]}
          >
            <Text style={index % 2 === 0 ? styles.messageText : styles.messageTextReceived}>{msg.text}</Text>
          </Animated.View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Digite sua mensagem..."
          placeholderTextColor="#888"
          value={input}
          onChangeText={setInput}
          style={styles.input}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1b21', // Softer background for modern look
    padding: 15,
  },
  header: {
    marginVertical: 20,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#f37100', // Brighter, modern blue
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
    backgroundColor: '#f37100', // Vibrant blue for sent messages
    alignSelf: 'flex-end',
    borderTopRightRadius: 5, // Less rounded for a sleek look
  },
  received: {
    backgroundColor: '#363942', // White for received messages
    alignSelf: 'flex-start',
    borderTopLeftRadius: 5,
    borderWidth: 1,
    borderColor: '#f37100', // Subtle border for received messages
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  messageTextReceived: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#2b2c33', // White input container for contrast
    borderTopWidth: 1,
    borderTopColor: '#f37100',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    backgroundColor: '#363942', // Slightly darker input background
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginRight: 10,
    fontSize: 16,
    color: '#fff',
  },
  sendButton: {
    backgroundColor: '#f37100',
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
    color: '#2b2c33',
    fontSize: 20,
    fontWeight: 'bold',
  },
  returnBtn: {
    marginTop: 40,
    backgroundColor: '#2b2c33', // Neutral gray for return button
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});