import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  TextInput, FlatList, KeyboardAvoidingView, Platform,
  ActivityIndicator, SafeAreaView, Keyboard, Alert
} from 'react-native';
import { X, Send, User, RotateCcw, AlertCircle, Loader2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import chatService from '../../services/chatService';
import signalRService from '../../services/signalRService';
import { useAuth } from '../../context/AuthContext';
import * as Haptics from 'expo-haptics';

export default function BookingChatModal({ isVisible, onClose, booking, session }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');

  const flatListRef = useRef(null);
  const sessionId = session?.chatSessionId || session?.id || booking?.chatSessionId;

  useEffect(() => {
    if (isVisible && sessionId) {
      loadMessages();
      setupSignalR();
    }

    return () => {
      if (sessionId) {
        signalRService.leaveChatSession(sessionId);
      }
    };
  }, [isVisible, sessionId]);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const response = await chatService.getChatMessages(sessionId);
      const items = response?.data || response || [];
      
      // Transform messages to match internal logic (Twitter-style mapping)
      const transformed = items.map(msg => ({
        ...msg,
        id: msg.chatMessageId || msg.id,
        text: msg.content,
        isMine: String(msg.senderId) === String(user?.userId),
        timestamp: msg.sentAt || msg.createdAt || new Date().toISOString()
      })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      setMessages(transformed);
    } catch (error) {
      console.error('[BookingChatModal] loadMessages error:', error);
    } finally {
      setIsLoading(false);
      // Delayed scroll to bottom after layout
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 300);
    }
  };

  const setupSignalR = async () => {
    try {
      await signalRService.joinChatSession(sessionId);
      setConnectionStatus('Connected');

      signalRService.onChatMessageReceived((msg) => {
        if (String(msg.chatSessionId) === String(sessionId)) {
          const isMine = String(msg.senderId) === String(user?.userId);
          
          setMessages(prev => {
            const exists = prev.some(m => m.id === (msg.chatMessageId || msg.id));
            if (exists) return prev;

            // Remove optimistic message if same content was just sent by me recently
            const filtered = isMine 
              ? prev.filter(m => !(m.isOptimistic && m.text.trim() === msg.content.trim()))
              : prev;
              
            const transformedMsg = {
              ...msg,
              id: msg.chatMessageId || msg.id,
              text: msg.content,
              isMine,
              timestamp: msg.sentAt || msg.createdAt || new Date().toISOString()
            };

            return [...filtered, transformedMsg].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          });
        }
      });

      signalRService.onChatStateChanged((status) => {
        setConnectionStatus(status);
      });
    } catch (err) {
      console.error('[BookingChatModal] signalR setup error:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;

    const content = inputText.trim();
    const tempId = `temp-${Date.now()}`;
    
    setInputText('');
    setIsSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Optimistic Update
    const optimisticMsg = {
      id: tempId,
      text: content,
      isMine: true,
      timestamp: new Date().toISOString(),
      isOptimistic: true
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      await chatService.sendChatMessage(sessionId, content);
      // SignalR will provide the real message soon
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn.');
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInputText(content);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessageItem = ({ item, index }) => {
    const isMine = item.isMine;
    const time = item.timestamp ? new Date(item.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
    
    // Grouping logic (X-style)
    const nextMsg = messages[index + 1];
    const isLastInSequence = !nextMsg || nextMsg.isMine !== isMine;

    return (
      <View style={[
        styles.messageWrapper, 
        isMine ? styles.myMessageWrapper : styles.theirMessageWrapper,
        isLastInSequence ? { marginBottom: 16 } : { marginBottom: 4 }
      ]}>
        {!isMine && isLastInSequence && (
          <View style={[styles.avatarBox, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{(booking?.advisorName || 'C').charAt(0)}</Text>
          </View>
        )}
        {!isMine && !isLastInSequence && <View style={styles.avatarPlaceholder} />}

        <View style={styles.bubbleContainer}>
          <View style={[
            styles.messageBubble, 
            isMine ? { backgroundColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
            item.isOptimistic && { opacity: 0.7 }
          ]}>
            <Text style={[styles.messageContent, { color: isMine ? '#fff' : colors.text }]}>{item.text}</Text>
          </View>
          {isLastInSequence && (
            <Text style={[styles.messageTime, { color: colors.secondaryText, textAlign: isMine ? 'right' : 'left' }]}>
              {time} {item.isOptimistic && '• Đang gửi...'}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {booking?.advisorName || 'Cố vấn tư vấn'}
            </Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: connectionStatus === 'Connected' ? '#10b981' : '#ef4444' }]} />
              <Text style={[styles.statusText, { color: colors.secondaryText }]}>
                {connectionStatus === 'Connected' ? 'Trực tuyến' : 'Đang kết nối...'}
              </Text>
            </View>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListHeaderComponent={() => (
              <View style={styles.welcomeContainer}>
                <View style={[styles.largeAvatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.largeAvatarText}>{(booking?.advisorName || 'C').charAt(0)}</Text>
                </View>
                <Text style={[styles.welcomeTitle, { color: colors.text }]}>{booking?.advisorName}</Text>
                <Text style={[styles.welcomeSubtitle, { color: colors.secondaryText }]}>Bắt đầu cuộc hội thoại tư vấn dự án</Text>
              </View>
            )}
          />
        )}

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
          style={{ flex: 0 }}
        >
          <View style={[styles.inputContainer, { borderTopColor: colors.border }]}>
            <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Bắt đầu tin nhắn mới"
                placeholderTextColor={colors.secondaryText + '80'}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxHeight={100}
              />
              <TouchableOpacity 
                style={[styles.sendBtn, { backgroundColor: inputText.trim() ? colors.primary : 'transparent' }]}
                onPress={handleSendMessage}
                disabled={!inputText.trim() || isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color={inputText.trim() ? "#fff" : colors.primary} />
                ) : (
                  <Send size={20} color={inputText.trim() ? "#fff" : colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  closeBtn: { padding: 4 },
  headerInfo: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '900' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  messageList: { paddingHorizontal: 16, paddingBottom: 20 },
  welcomeContainer: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  largeAvatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  largeAvatarText: { color: '#fff', fontSize: 24, fontWeight: '900' },
  welcomeTitle: { fontSize: 20, fontWeight: '900' },
  welcomeSubtitle: { fontSize: 14, fontWeight: '600', opacity: 0.8 },
  messageWrapper: { flexDirection: 'row', alignItems: 'flex-end', maxWidth: '85%' },
  myMessageWrapper: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  theirMessageWrapper: { alignSelf: 'flex-start' },
  avatarBox: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  avatarPlaceholder: { width: 28, height: 28, marginRight: 8 },
  avatarText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  bubbleContainer: { flexShrink: 1 },
  messageBubble: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  messageContent: { fontSize: 15, fontWeight: '500', lineHeight: 20 },
  messageTime: { fontSize: 10, marginTop: 4, paddingHorizontal: 4 },
  inputContainer: { padding: 12, borderTopWidth: 1 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 24, 
    borderWidth: 1, 
    paddingHorizontal: 12, 
    paddingVertical: 4 
  },
  input: { flex: 1, paddingHorizontal: 8, fontSize: 16, minHeight: 40 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
