import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { db } from '../../../services/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { useNavigation } from '@react-navigation/native';

export default function Chat() {
  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const scrollViewRef = useRef();

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('timestamp'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
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
      <TouchableOpacity style={styles.returnBtn} onPress={() => navigation.navigate('Home')}><Text>Voltar</Text></TouchableOpacity>
      <Text style={styles.header}>Chat</Text>

      <ScrollView
        style={styles.messagesContainer}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, index) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              index % 2 === 0 ? styles.sent : styles.received
            ]}
          >
            <Text style={index % 2 === 0 ? styles.messageText : styles.messageTextReceived}>{msg.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Digite sua mensagem..."
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
    backgroundColor: '#fff',
    padding: 10
  },
  header: {
    marginVertical: 20,
    fontSize: 24,
    fontWeight: 'bold',
    paddingVertical: 10,
    textAlign: 'center',
    color: '#0084FF'
  },
  messagesContainer: {
    flex: 1,
    marginVertical: 10
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 10,
    marginVertical: 5,
    borderRadius: 20
  },
  sent: {
    backgroundColor: '#0084FF',
    alignSelf: 'flex-end',
    borderTopRightRadius: 0
  },
  received: {
    backgroundColor: '#E4E6EB',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 0
    
  },
  messageText: {
    color: '#fff'
  },
  messageTextReceived: {
    color: '#000'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: '#ddd'
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10
  },
  sendButton: {
    backgroundColor: '#0084FF',
    borderRadius: 50,
    width: 40,
    alignItems: 'center',
    padding: 10
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16
  },
  returnBtn: {
    marginTop: 30,
    backgroundColor: "#8488",
    width: 60,
    height: 30,
    alignItems: 'center', 
    padding: 5
  }
});
