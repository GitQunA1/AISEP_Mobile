import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  TextInput, FlatList, KeyboardAvoidingView, Platform,
  ActivityIndicator, SafeAreaView, Keyboard, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ChevronLeft, Send, MoreVertical, Phone, Info } from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import chatService from '../../src/services/chatService';
import signalRService from '../../src/services/signalRService';
import * as Haptics from 'expo-haptics';

/**
 * ChatSession Screen - Real-time messaging between users
 * Consistent with BookingChatModal UI/UX
 */
export default function ChatSessionScreen() {
  const { id: sessionId, name } = useLocalSearchParams();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  const { user } = useAuth();
  const router = useRouter();
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');

  const flatListRef = useRef(null);
  const chatPartnerName = name || 'Nhà đầu tư';
  const chatPartnerAvatar = (chatPartnerName || 'C').charAt(0);

  useEffect(() => {
    if (sessionId) {
      loadMessages();
      setupSignalR();
    }

    return () => {
      if (sessionId) {
        signalRService.leaveChatSession(sessionId);
      }
    };
  }, [sessionId]);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const response = await chatService.getChatMessages(sessionId);
      const items = response?.data || response || [];
      
      const transformed = items.map(msg => ({
        ...msg,
        id: msg.chatMessageId || msg.id || msg.chat_message_id,
        text: msg.content || msg.Content || msg.content_text,
        isMine: String(msg.senderId || msg.SenderId || msg.sender_id) === String(user?.userId),
        timestamp: msg.sentAt || msg.createdAt || msg.sent_at || new Date().toISOString()
      })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      setMessages(transformed);
    } catch (error) {
      console.error('[ChatSession] loadMessages error:', error);
    } finally {
      setIsLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 300);
    }
  };

  const setupSignalR = async () => {
    try {
      await signalRService.joinChatSession(sessionId);
      setConnectionStatus('Connected');

      const unsubscribe = signalRService.onChatMessageReceived((msg) => {
        const msgSessionId = msg.chatSessionId || msg.ChatSessionId || msg.chat_session_id;
        const msgSenderId = msg.senderId || msg.SenderId || msg.sender_id;
        const msgContent = msg.content || msg.Content || msg.content_text || '';
        
        if (String(msgSessionId) === String(sessionId)) {
          const isMine = String(msgSenderId) === String(user?.userId);
          
          setMessages(prev => {
            const msgId = msg.chatMessageId || msg.id || msg.chat_message_id;
            const exists = prev.some(m => m.id === msgId);
            if (exists) return prev;

            const filtered = isMine 
              ? prev.filter(m => !(m.isOptimistic && m.text.trim() === msgContent.trim()))
              : prev;
              
            const transformedMsg = {
              ...msg,
              id: msgId,
              text: msgContent,
              isMine,
              timestamp: msg.sentAt || msg.createdAt || msg.SentAt || msg.sent_at || new Date().toISOString()
            };

            return [...filtered, transformedMsg].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          });
        }
      });

      const stateUnsubscribe = signalRService.onChatStateChanged((status) => {
        setConnectionStatus(status);
      });

      return () => {
        if (unsubscribe) unsubscribe();
        if (stateUnsubscribe) stateUnsubscribe();
      };
    } catch (err) {
      console.error('[ChatSession] signalR setup error:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;

    const content = inputText.trim();
    const tempId = `temp-${Date.now()}`;
    
    setInputText('');
    setIsSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const optimisticMsg = {
      id: tempId,
      text: content,
      isMine: true,
      timestamp: new Date().toISOString(),
      isOptimistic: true
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const response = await chatService.sendChatMessage(sessionId, content);
      if (response && (response.success || response.isSuccess || response.data)) {
        const realMsg = response.data || response;
        setMessages(prev => prev.map(m => m.id === tempId ? {
          ...realMsg,
          id: realMsg.chatMessageId || realMsg.id || realMsg.chat_message_id || tempId,
          text: realMsg.content || realMsg.Content || content,
          isMine: true,
          timestamp: realMsg.sentAt || realMsg.createdAt || realMsg.SentAt || new Date().toISOString(),
          isOptimistic: false
        } : m));
      }
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
            <Text style={styles.avatarText}>{chatPartnerAvatar}</Text>
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {chatPartnerName}
          </Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: connectionStatus === 'Connected' ? '#10b981' : '#ef4444' }]} />
            <Text style={[styles.statusText, { color: colors.secondaryText }]}>
              {connectionStatus === 'Connected' ? 'Trực tuyến' : 'Đang kết nối...'}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionBtn}>
            <Phone size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <MoreVertical size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => (item.id || item.tempId).toString()}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={() => (
            <View style={styles.welcomeContainer}>
              <View style={[styles.largeAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.largeAvatarText}>{chatPartnerAvatar}</Text>
              </View>
              <Text style={[styles.welcomeTitle, { color: colors.text }]}>{chatPartnerName}</Text>
              <Text style={[styles.welcomeSubtitle, { color: colors.secondaryText }]}>
                Hội thoại thảo luận về dự án và kết nối đầu tư
              </Text>
            </View>
          )}
        />
      )}

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={[styles.inputContainer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
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
  backBtn: { padding: 4 },
  headerInfo: { flex: 1, paddingLeft: 12 },
  headerTitle: { fontSize: 16, fontWeight: '900' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 4 },
  messageList: { paddingHorizontal: 16, paddingBottom: 20 },
  welcomeContainer: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  largeAvatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  largeAvatarText: { color: '#fff', fontSize: 24, fontWeight: '900' },
  welcomeTitle: { fontSize: 20, fontWeight: '900' },
  welcomeSubtitle: { fontSize: 14, fontWeight: '600', opacity: 0.8, textAlign: 'center', paddingHorizontal: 40 },
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
  inputContainer: { padding: 12, borderTopWidth: 1, paddingBottom: Platform.OS === 'ios' ? 24 : 12 },
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
