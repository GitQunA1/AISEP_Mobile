import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { X, Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react-native';
import bookingService from '../services/bookingService';
import THEME from '../constants/Theme';

export default function AdvisorBookingModal({ isVisible, advisor, onClose, onSuccess }) {
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!bookingDate) {
      setError('Vui lòng nhập ngày hẹn (YYYY-MM-DD)');
      return;
    }
    
    // Basic date format validation
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(bookingDate)) {
      setError('Định dạng ngày không hợp lệ (YYYY-MM-DD)');
      return;
    }

    if (startTime >= endTime) {
      setError('Thời gian kết thúc phải sau thời gian bắt đầu');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const startDateTime = `${bookingDate}T${startTime}:00Z`;
      const endDateTime = `${bookingDate}T${endTime}:00Z`;
      
      const payload = {
        advisorId: advisor.advisorId,
        startTime: startDateTime,
        endTime: endDateTime
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

  // Get tomorrow's date as a hint
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
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Đặt Hẹn Cố Vấn</Text>
              <Text style={styles.subtitle}>Gửi yêu cầu kết nối</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={THEME.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.advisorBrief}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{(advisor?.userName || 'A').charAt(0)}</Text>
            </View>
            <View style={styles.advisorInfo}>
              <Text style={styles.advisorName}>{advisor?.userName}</Text>
              <Text style={styles.advisorExpertise}>{advisor?.expertise || 'Chuyên gia cố vấn'}</Text>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <AlertCircle size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Text style={styles.label}>Ngày Hẹn (YYYY-MM-DD)</Text>
            <View style={styles.inputContainer}>
              <CalendarIcon size={18} color={THEME.colors.secondaryText} />
              <TextInput
                style={styles.input}
                placeholder={dateHint}
                value={bookingDate}
                onChangeText={setBookingDate}
                placeholderTextColor={THEME.colors.border}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, { marginRight: 10 }]}>
                <Text style={styles.label}>Bắt Đầu</Text>
                <View style={styles.inputContainer}>
                  <Clock size={16} color={THEME.colors.secondaryText} />
                  <TextInput
                    style={styles.input}
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholder="09:00"
                  />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Kết Thúc</Text>
                <View style={styles.inputContainer}>
                  <Clock size={16} color={THEME.colors.secondaryText} />
                  <TextInput
                    style={styles.input}
                    value={endTime}
                    onChangeText={setEndTime}
                    placeholder="10:00"
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.submitBtn, (!bookingDate || isSubmitting) && styles.submitBtnDisabled]} 
              onPress={handleSubmit}
              disabled={!bookingDate || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitText}>Gửi Yêu Cầu</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  advisorBrief: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
  },
  advisorInfo: {
    marginLeft: 12,
  },
  advisorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  advisorExpertise: {
    fontSize: 12,
    color: '#64748B',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginLeft: 8,
  },
  form: {
    marginBottom: 20,
  },
  formGroup: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#1E293B',
  },
  row: {
    flexDirection: 'row',
    marginTop: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  submitBtn: {
    flex: 2,
    height: 48,
    backgroundColor: THEME.colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
