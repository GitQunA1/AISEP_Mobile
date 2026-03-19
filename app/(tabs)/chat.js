import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TextInput, 
  TouchableOpacity, KeyboardAvoidingView, Platform, 
  Animated 
} from 'react-native';
import { Send, Bot, ArrowRight, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';
import TabScreenWrapper from '../../src/components/navigation/TabScreenWrapper';
import { useNavigation } from 'expo-router';

export default function ChatScreen() {
  const navigation = useNavigation();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

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

  // Border Animation for Input
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputBorderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(inputBorderAnim, {
      toValue: isInputFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isInputFocused]);

  const borderColor = inputBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary],
  });

  const suggestedQuestions = [
    "Làm sao để tăng điểm AI cho hồ sơ startup?",
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
        <View style={[styles.botIcon, { backgroundColor: colors.primary }]}>
          <Bot size={14} color="#fff" />
        </View>
      )}
      <View style={[
        styles.messageBubble, 
        item.role === 'user' ? 
          [styles.userBubble, { backgroundColor: colors.primary }] : 
          [styles.assistantBubble, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]
      ]}>
        <Text style={[
          styles.messageText, 
          item.role === 'user' ? { color: '#fff' } : { color: colors.text }
        ]}>
          {item.content}
        </Text>
      </View>
    </View>
  );

  return (
    <TabScreenWrapper>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={[styles.container, { backgroundColor: colors.background }]}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* HEADER ROW - Re-added internal sparkle container for consistency */}
        <View style={styles.headerRow}>
          <View style={styles.titleContainer} />
          <View style={[styles.sparkleContainer, { backgroundColor: colors.primary + '20' }]}>
            <Sparkles size={16} color={colors.primary} />
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            messages.length === 1 ? (
              <View style={styles.welcomeSection}>
                <View style={styles.welcomeHero}>
                  <View style={[styles.heroIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Bot size={42} color={colors.primary} />
                  </View>
                  <Text style={[styles.welcomeTitle, { color: colors.text }]}>Trợ lý AI chuyên nghiệp</Text>
                  <Text style={[styles.welcomeSubtitle, { color: colors.secondaryText }]}>
                    Hãy đặt bất kỳ câu hỏi nào để bắt đầu hành trình khởi nghiệp của bạn.
                  </Text>
                </View>
                
                <View style={styles.suggestions}>
                  <Text style={[styles.suggestionTitle, { color: colors.text }]}>Gợi ý cho bạn</Text>
                  <View style={styles.chipRow}>
                    {suggestedQuestions.map((q, idx) => (
                      <TouchableOpacity 
                        key={idx} 
                        style={[styles.suggestionChip, { backgroundColor: colors.card, borderColor: colors.border }]} 
                        onPress={() => setInput(q)}
                      >
                        <Text style={[styles.suggestionText, { color: colors.text }]} numberOfLines={1}>{q}</Text>
                        <ArrowRight size={14} color={colors.primary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            ) : null
          }
        />

        <View style={[styles.inputArea, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <Animated.View style={[
            styles.inputContainer, 
            { 
              backgroundColor: colors.inputBackground, 
              borderColor: borderColor 
            }
          ]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Hỏi AISEP về dự án của bạn..."
              value={input}
              onChangeText={setInput}
              placeholderTextColor={colors.secondaryText}
              multiline
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            />
            <TouchableOpacity 
              style={[styles.sendButton, { backgroundColor: colors.primary }, !input.trim() && styles.sendDisabled]} 
              onPress={handleSend}
              disabled={!input.trim()}
            >
              <Send size={18} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </TabScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 10 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    marginBottom: 6,
  },
  titleContainer: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800' },
  sparkleContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    paddingHorizontal: 20,
    paddingBottom: 10,
    lineHeight: 18,
  },
  messageList: { padding: 20, paddingBottom: 30 },
  messageRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end' },
  userRow: { justifyContent: 'flex-end' },
  assistantRow: { justifyContent: 'flex-start' },
  botIcon: { 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 8, 
    marginBottom: 2 
  },
  messageBubble: { maxWidth: '82%', padding: 12, borderRadius: 18 },
  userBubble: { borderBottomRightRadius: 4 },
  assistantBubble: { borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 22 },
  
  welcomeSection: { paddingVertical: 20, alignItems: 'center' },
  welcomeHero: { alignItems: 'center', marginBottom: 32 },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  welcomeTitle: { fontSize: 18, fontWeight: '700' },
  welcomeSubtitle: { 
    fontSize: 14, 
    textAlign: 'center', 
    marginTop: 8, 
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  
  suggestions: { width: '100%' },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  chipRow: { gap: 8 },
  suggestionChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 14, 
    borderRadius: 16,
    borderWidth: 1,
  },
  suggestionText: { flex: 1, fontSize: 14, fontWeight: '500', marginRight: 12 },
  
  inputArea: { 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    borderTopWidth: 1,
  },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    borderRadius: 24, 
    paddingLeft: 16, 
    paddingRight: 6, 
    paddingVertical: 6,
    borderWidth: 1.5,
  },
  input: { 
    flex: 1, 
    fontSize: 15, 
    maxHeight: 120, 
    paddingVertical: Platform.OS === 'ios' ? 8 : 4 
  },
  sparkleHeaderContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  sendButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  sendDisabled: { opacity: 0.5 },
});
