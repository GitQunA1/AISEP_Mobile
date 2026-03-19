import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  TextInput, Alert, ActivityIndicator, Platform, 
  ScrollView, KeyboardAvoidingView, Pressable, Dimensions 
} from 'react-native';
import { X, Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react-native';
import bookingService from '../services/bookingService';
import { useTheme } from '../context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AdvisorBookingModal({ isVisible, advisor, onClose, onSuccess }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const [formData, setFormData] = useState({
    bookingDate: '',
    startTime: '09:00',
    endTime: '10:00',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const initial = (advisor?.userName || 'A').charAt(0).toUpperCase();

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async () => {
    if (!formData.bookingDate) {
      setError('Vui lòng nhập ngày hẹn');
      return;
    }
    
    // Basic date format validation (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.bookingDate)) {
      setError('Định dạng ngày không hợp lệ (YYYY-MM-DD)');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      setError('Thời gian kết thúc phải sau thời gian bắt đầu');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Replicate web's Date logic
      const startDateTime = new Date(`${formData.bookingDate}T${formData.startTime}:00`);
      const endDateTime = new Date(`${formData.bookingDate}T${formData.endTime}:00`);
      
      const payload = {
        advisorId: advisor.advisorId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString()
      };

      await bookingService.createBooking(payload);
      
      if (onSuccess) {
        onSuccess(advisor.advisorId);
      }
      onClose();
      Alert.alert('Thành công', 'Yêu cầu kết nối của bạn đã được gửi!');
    } catch (err) {
      console.error('Booking error:', err);
      setError('Đã xảy ra lỗi khi gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateHint = tomorrow.toISOString().split('T')[0];

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.content, { backgroundColor: colors.card }]}
        >
          {/* DRAG HANDLE */}
          <View style={styles.dragHandleContainer}>
              <View style={[styles.dragHandle, { backgroundColor: activeTheme.isDark ? '#555' : '#ccc' }]} />
          </View>

          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Đặt Hẹn Cố Vấn</Text>
              <Text style={[styles.subtitle, { color: colors.secondaryText }]}>Gửi yêu cầu và sắp xếp lịch trình</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={20}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollBody} 
            showsVerticalScrollIndicator={false} 
            bounces={false}
            overScrollMode="never"
          >
            {/* ADVISOR PREVIEW */}
            <View style={[styles.advisorBrief, { backgroundColor: colors.mutedBackground }]}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                {advisor?.profileImage ? (
                    <Image source={{ uri: advisor.profileImage }} style={styles.avatarImg} />
                ) : (
                    <Text style={styles.avatarText}>{initial}</Text>
                )}
              </View>
              <View style={styles.advisorInfo}>
                <Text style={[styles.advisorName, { color: colors.text }]}>{advisor?.userName}</Text>
                <Text style={[styles.advisorExpertise, { color: colors.secondaryText }]}>
                    {advisor?.expertise || 'Cố vấn chuyên gia'}
                </Text>
              </View>
            </View>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: activeTheme.isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2' }]}>
                <AlertCircle size={18} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Ngày Hẹn <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <CalendarIcon size={18} color={colors.secondaryText} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={dateHint}
                  value={formData.bookingDate}
                  onChangeText={(val) => handleInputChange('bookingDate', val)}
                  placeholderTextColor={colors.secondaryText + '80'}
                />
              </View>
              <Text style={styles.hintText}>Định dạng: YYYY-MM-DD</Text>
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, { marginRight: 12 }]}>
                <Text style={[styles.label, { color: colors.text }]}>
                    Bắt đầu <Text style={{ color: colors.error }}>*</Text>
                </Text>
                <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Clock size={16} color={colors.secondaryText} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={formData.startTime}
                    onChangeText={(val) => handleInputChange('startTime', val)}
                    placeholder="09:00"
                    placeholderTextColor={colors.secondaryText + '80'}
                  />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                    Kết thúc <Text style={{ color: colors.error }}>*</Text>
                </Text>
                <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Clock size={16} color={colors.secondaryText} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={formData.endTime}
                    onChangeText={(val) => handleInputChange('endTime', val)}
                    placeholder="10:00"
                    placeholderTextColor={colors.secondaryText + '80'}
                  />
                </View>
              </View>
            </View>

            <Text style={[styles.noteText, { color: colors.secondaryText }]}>
                * Lưu ý: Thời gian có thể được điều chỉnh sau khi hai bên thỏa thuận.
            </Text>
            
            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity 
              style={[styles.cancelBtn, { borderColor: colors.border }]} 
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={[styles.cancelBtnText, { color: colors.text }]}>Hủy bỏ</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.submitBtn, { backgroundColor: colors.text }]} 
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text style={[styles.submitBtnText, { color: colors.background }]}>Gửi yêu cầu</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    paddingHorizontal: 20,
  },
  advisorBrief: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  advisorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  advisorName: {
    fontSize: 16,
    fontWeight: '700',
  },
  advisorExpertise: {
    fontSize: 13,
    marginTop: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginLeft: 10,
    flex: 1,
  },
  formGroup: {
    marginBottom: 20,
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
  },
  hintText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
  },
  noteText: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 2,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
