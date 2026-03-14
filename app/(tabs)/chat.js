import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Send, Sparkles, History, Bot, Target, TrendingUp, Users, ArrowRight } from 'lucide-react-native';
import THEME from '../../src/constants/Theme';

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      content: 'Xin chào! Tôi là Trợ lý AI của AISEP. Tôi có thể giúp gì cho bạn hôm nay?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const flatListRef = useRef(null);

  const suggestedQuestions = [
    "Làm sao để tăng điểm AI cho hồ sơ startup của tôi?",
    "Tìm các nhà đầu tư AgriTech.",
    "Tôi cần chuẩn bị gì cho Pitch Deck?",
    "Quy trình kết nối cố vấn."
  ];

  const handleSend = () => {
    if (!input.trim()) return;

    const newUserMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInput('');

    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Cảm ơn bạn đã đặt câu hỏi. Tính năng phản hồi AI đang được phát triển. Tôi đã ghi nhận: "' + input + '".',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.messageRow, item.role === 'user' ? styles.userRow : styles.assistantRow]}>
      {item.role === 'assistant' && (
        <View style={styles.botIcon}>
          <Bot size={16} color="#fff" />
        </View>
      )}
      <View style={[styles.messageBubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.messageText, item.role === 'user' ? styles.userText : styles.assistantText]}>{item.content}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListHeaderComponent={
          messages.length === 1 ? (
            <View style={styles.welcomeSection}>
              <View style={styles.welcomeHero}>
                <Bot size={48} color={THEME.colors.primary} />
                <Text style={styles.welcomeTitle}>Chào mừng bạn đến với AI Hub</Text>
                <Text style={styles.welcomeSubtitle}>Hãy đặt bất kỳ câu hỏi nào để bắt đầu hành trình khởi nghiệp của bạn.</Text>
              </View>
              <View style={styles.suggestions}>
                {suggestedQuestions.map((q, idx) => (
                  <TouchableOpacity key={idx} style={styles.suggestionBtn} onPress={() => setInput(q)}>
                    <Text style={styles.suggestionText} numberOfLines={1}>{q}</Text>
                    <ArrowRight size={14} color={THEME.colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null
        }
      />

      <View style={styles.inputArea}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nhập câu hỏi tại đây..."
            value={input}
            onChangeText={setInput}
            placeholderTextColor={THEME.colors.secondaryText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, !input.trim() && styles.sendDisabled]} 
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Send size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  messageList: { padding: THEME.spacing.md, paddingBottom: THEME.spacing.xl },
  messageRow: { flexDirection: 'row', marginBottom: THEME.spacing.md, alignItems: 'flex-end' },
  userRow: { justifyContent: 'flex-end' },
  assistantRow: { justifyContent: 'flex-start' },
  botIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: THEME.colors.primary, alignItems: 'center', justifyCenter: 'center', marginRight: 8, marginBottom: 4 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 18 },
  userBubble: { backgroundColor: THEME.colors.primary, borderBottomRightRadius: 4 },
  assistantBubble: { backgroundColor: THEME.colors.secondaryBackground, borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 20 },
  userText: { color: '#fff' },
  assistantText: { color: THEME.colors.text },
  welcomeSection: { paddingVertical: 40, alignItems: 'center' },
  welcomeHero: { alignItems: 'center', marginBottom: 32 },
  welcomeTitle: { fontSize: 20, fontWeight: '700', marginTop: 16, color: THEME.colors.text },
  welcomeSubtitle: { fontSize: 14, color: THEME.colors.secondaryText, textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
  suggestions: { width: '100%', paddingHorizontal: THEME.spacing.md },
  suggestionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: THEME.colors.secondaryBackground, padding: 12, borderRadius: 12, marginBottom: 8 },
  suggestionText: { flex: 1, fontSize: 14, color: THEME.colors.text, marginRight: 8 },
  inputArea: { padding: THEME.spacing.md, borderTopWidth: 1, borderTopColor: THEME.colors.border, backgroundColor: THEME.colors.background },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: THEME.colors.secondaryBackground, borderRadius: 24, paddingLeft: 16, paddingRight: 6, paddingVertical: 6 },
  input: { flex: 1, fontSize: 15, color: THEME.colors.text, maxHeight: 100, paddingVertical: 8 },
  sendButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: THEME.colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.5 },
});
