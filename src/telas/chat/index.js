import React, { useState, useLayoutEffect, useCallback } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, View, TouchableOpacity } from 'react-native';
import { GiftedChat, Bubble, InputToolbar } from 'react-native-gifted-chat';
import { Ionicons } from '@expo/vector-icons';

export default function chat({ organizer, onClose }) {
  const [messages, setMessages] = useState([]);

  // Initial message from organizer
  useLayoutEffect(() => {
    if (organizer) {
      setMessages([
        {
          _id: 1,
          text: `Olá! Você está conversando com ${organizer.name}. Como podemos ajudar hoje?`,
          createdAt: new Date(),
          user: { _id: 2, name: organizer.name }
        }
      ]);
    }
  }, [organizer]);

  // Send new messages
  const onSend = useCallback((newMessages = []) => {
    setMessages(prev => GiftedChat.append(prev, newMessages));
  }, []);

  return (
    <View style={styles.chatContainer}>
      {/* Close button for modal context */}
      {onClose && (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      )}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <GiftedChat
          messages={messages}
          onSend={msgs => onSend(msgs)}
          user={{ _id: 1, name: 'Você' }}
          renderBubble={props => (
            <Bubble
              {...props}
              wrapperStyle={{ right: { backgroundColor: '#2196f3' }, left: { backgroundColor: '#f1f0f0' } }}
            />
          )}
          renderInputToolbar={props => (
            <InputToolbar {...props} containerStyle={styles.inputToolbar} primaryStyle={{ alignItems: 'center' }} />
          )}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  chatContainer: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  inputToolbar: { borderTopWidth: 1, borderTopColor: '#ddd', padding: 8 },
  closeButton: { padding: 12, position: 'absolute', top: 40, left: 16, zIndex: 10 }
});