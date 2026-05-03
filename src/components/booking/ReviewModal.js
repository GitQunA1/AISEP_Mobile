import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  TextInput, ActivityIndicator, KeyboardAvoidingView, 
  Platform, ScrollView, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Star, Send, Sparkle, MessageSquareText } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import reviewService from '../../services/reviewService';
import Button from '../Button';
import Card from '../Card';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ReviewModal({ isVisible, onClose, booking, onDone, viewerRole = 'Customer' }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const existingReview = booking?.existingReview;
  const isReadOnly = !!existingReview;

  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [content, setContent] = useState(existingReview?.reviewContent || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const advisorName = booking?.advisorName || 'Cố vấn';
  const projectName = booking?.projectName || 'Dự án';

  const handleRatingPress = (val) => {
    if (isReadOnly) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRating(val);
    if (error) setError(null);
  };

  const handleSubmit = async () => {
    if (isReadOnly) {
      onClose();
      return;
    }

    if (rating === 0) {
      setError('Vui lòng chọn số sao để đánh giá.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        bookingId: booking.id || booking.bookingId,
        rating: rating,
        reviewContent: content.trim() || undefined
      };

      await reviewService.createReview(payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onDone?.();
    } catch (err) {
      console.error('[ReviewModal] Submit failed:', err);
      setError(err.message || 'Không thể gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerIconContainer}>
              <Sparkle size={20} color={colors.primary} fill={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {isReadOnly ? (['Advisor', 'Staff'].includes(viewerRole) ? 'Đánh giá từ khách hàng' : 'Đánh giá của bạn') : 'Đánh giá buổi tư vấn'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.content}>
              <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
                {isReadOnly 
                  ? (['Advisor', 'Staff'].includes(viewerRole) ? 'Nội dung khách hàng đã gửi cho buổi tư vấn này' : 'Nội dung bạn đã gửi cho buổi tư vấn này') 
                  : 'Chia sẻ trải nghiệm của bạn để giúp chúng tôi cải thiện chất lượng dịch vụ.'}
              </Text>

              {/* Advisor Card */}
              <Card style={styles.advisorCard}>
                <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>{advisorName.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.advisorInfo}>
                  <Text style={[styles.advisorName, { color: colors.text }]}>{advisorName}</Text>
                  <Text style={[styles.projectName, { color: colors.secondaryText }]}>{projectName}</Text>
                </View>
              </Card>

              {/* Rating Section */}
              <View style={styles.ratingSection}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {isReadOnly ? (['Advisor', 'Staff'].includes(viewerRole) ? 'Mức độ hài lòng' : 'Đánh giá của bạn') : 'Bạn hài lòng với buổi tư vấn này chứ?'}
                </Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => handleRatingPress(star)}
                      disabled={isReadOnly}
                      style={styles.starBtn}
                    >
                      <Star 
                        size={48} 
                        color={rating >= star ? '#f59e0b' : colors.border} 
                        fill={rating >= star ? '#f59e0b' : 'transparent'} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                {rating > 0 && !isReadOnly && (
                   <Text style={[styles.ratingHint, { color: colors.primary }]}>
                     {rating === 5 ? 'Tuyệt vời!' : rating >= 4 ? 'Rất tốt' : rating >= 3 ? 'Bình thường' : 'Cần cải thiện'}
                   </Text>
                )}
              </View>

              {/* Feedback Section */}
              <View style={styles.feedbackSection}>
                <View style={styles.labelRow}>
                  <MessageSquareText size={16} color={colors.secondaryText} />
                  <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>Nhận xét thêm</Text>
                </View>
                <TextInput
                  style={[
                    styles.textarea, 
                    { 
                      backgroundColor: colors.card, 
                      color: colors.text, 
                      borderColor: colors.border,
                      textAlignVertical: 'top'
                    }
                  ]}
                  placeholder={isReadOnly ? "Không có nhận xét" : "Bạn có muốn chia sẻ thêm điều gì không?"}
                  placeholderTextColor={colors.secondaryText + '80'}
                  multiline
                  numberOfLines={4}
                  value={content}
                  onChangeText={(text) => !isReadOnly && setContent(text)}
                  editable={!isReadOnly}
                />
              </View>

              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            {isReadOnly ? (
              <Button 
                title="Đóng" 
                onPress={onClose} 
                style={{ width: '100%' }}
              />
            ) : (
              <View style={styles.actionRow}>
                <Button 
                  title="Để sau" 
                  variant="outline" 
                  onPress={onClose}
                  style={{ flex: 1 }}
                  disabled={isSubmitting}
                />
                <Button 
                  title={isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
                  onPress={handleSubmit}
                  style={{ flex: 2 }}
                  disabled={isSubmitting || rating === 0}
                  icon={isSubmitting ? null : <Send size={18} color="#fff" />}
                  loading={isSubmitting}
                />
              </View>
            )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerIconContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  closeBtn: { padding: 4 },
  scrollContent: { paddingBottom: 20 },
  content: { padding: 20 },
  subtitle: { fontSize: 14, lineHeight: 22, marginBottom: 24 },
  advisorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 32,
    gap: 16
  },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '900' },
  advisorInfo: { flex: 1 },
  advisorName: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  projectName: { fontSize: 14, fontWeight: '600' },
  ratingSection: { alignItems: 'center', marginBottom: 32 },
  label: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  starRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  starBtn: { padding: 4 },
  ratingHint: { fontSize: 14, fontWeight: '700' },
  feedbackSection: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  textarea: {
    borderRadius: 16,
    padding: 16,
    height: 120,
    fontSize: 15,
    borderWidth: 1,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  errorText: { color: '#f4212e', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
  },
  actionRow: { flexDirection: 'row', gap: 12 }
});
