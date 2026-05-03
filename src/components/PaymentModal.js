import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  Image, ActivityIndicator, Dimensions, Platform, 
  ScrollView
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { 
  X, CheckCircle, AlertCircle, RefreshCw, 
  QrCode, Clock, Info, Copy 
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import paymentService from '../services/paymentService';
import { useTheme } from '../context/ThemeContext';
import Button from './Button';
import FadeInView from './FadeInView';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const POLL_INTERVAL_MS = 3000;

export default function PaymentModal({ 
  isVisible, 
  onClose, 
  bookingId, 
  price, 
  advisorName, 
  slotCount, 
  onPaid 
}) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const [phase, setPhase] = useState('loading'); // loading | qr | success | failed | error
  const [checkout, setCheckout] = useState(null); 
  const [errorMsg, setErrorMsg] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);
  const pollRef = useRef(null);
  const hasCalledPaid = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback((bid) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const status = await paymentService.getBookingPaymentStatus(bid);
        if (status?.isPaid || status?.transactionStatus === 'Completed' || status?.bookingStatus === 'Confirmed') {
          stopPolling();
          setPhase('success');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          if (!hasCalledPaid.current) {
            hasCalledPaid.current = true;
            onPaid?.();
          }
        } else if (status?.transactionStatus === 'Failed') {
          stopPolling();
          setPhase('failed');
        }
      } catch (_) {
        // Silently ignore polling errors
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling, onPaid]);

  const doCheckout = useCallback(async (bid) => {
    setPhase('loading');
    setErrorMsg('');
    try {
      const result = await paymentService.checkoutBooking(bid);
      setCheckout(result);
      setPhase('qr');
      startPolling(bid);
    } catch (e) {
      setErrorMsg(e?.message || 'Không thể tạo thanh toán. Vui lòng thử lại.');
      setPhase('error');
    }
  }, [startPolling]);

  useEffect(() => {
    if (isVisible && bookingId) {
      doCheckout(bookingId);
    }
    return () => stopPolling();
  }, [isVisible, bookingId, doCheckout, stopPolling]);

  const handleRetry = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRetrying(true);
    await doCheckout(bookingId);
    setIsRetrying(false);
  };

  const copyToClipboard = async (text, label) => {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // You could add a toast here if available
  };

  const formatPrice = (p) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  const insets = useSafeAreaInsets();

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={[styles.fullContainer, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerInfo}>
            <Text style={[styles.title, { color: colors.text }]}>Thanh Toán</Text>
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>{advisorName} • {slotCount}h</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={15}>
            <X size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Loading */}
            {phase === 'loading' && (
              <View style={styles.centeredState}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.statusText, { color: colors.secondaryText }]}>Đang khởi tạo giao dịch...</Text>
              </View>
            )}

            {/* QR Screen */}
            {phase === 'qr' && checkout && (
              <FadeInView style={styles.qrSection}>
                <View style={[styles.amountCard, { backgroundColor: colors.primary + '10' }]}>
                   <Text style={[styles.amountLabel, { color: colors.secondaryText }]}>Số tiền cần thanh toán</Text>
                   <Text style={[styles.amountValue, { color: colors.primary }]}>{formatPrice(checkout.amount)}</Text>
                </View>

                <View style={[styles.qrWrapper, { borderColor: colors.border }]}>
                  {checkout.qrCodeUrl ? (
                    <Image
                      source={{ uri: checkout.qrCodeUrl }}
                      style={styles.qrImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.qrPlaceholder}>
                      <QrCode size={64} color={colors.border} />
                      <Text style={{ color: colors.secondaryText }}>QR không khả dụng</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity 
                   style={[styles.codeRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                   onPress={() => copyToClipboard(checkout.paymentCode, 'Mã thanh toán')}
                >
                  <View>
                    <Text style={[styles.codeLabel, { color: colors.secondaryText }]}>Nội dung chuyển khoản</Text>
                    <Text style={[styles.codeValue, { color: colors.text }]}>{checkout.paymentCode}</Text>
                  </View>
                  <Copy size={18} color={colors.primary} />
                </TouchableOpacity>

                <View style={styles.pollIndicator}>
                   <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
                   <Text style={[styles.pollText, { color: colors.secondaryText }]}>Đang chờ xác nhận từ ngân hàng...</Text>
                </View>

                <View style={[styles.infoBox, { backgroundColor: colors.border + '30' }]}>
                   <Info size={16} color={colors.secondaryText} />
                   <Text style={[styles.infoText, { color: colors.secondaryText }]}>
                     Vui lòng không thay đổi số tiền hoặc nội dung chuyển khoản để hệ thống tự động xác nhận.
                   </Text>
                </View>
              </FadeInView>
            )}

            {/* Success */}
            {phase === 'success' && (
              <FadeInView style={styles.centeredState}>
                <View style={[styles.iconOuter, { backgroundColor: colors.accentGreen + '20' }]}>
                  <CheckCircle size={60} color={colors.accentGreen} />
                </View>
                <Text style={[styles.successTitle, { color: colors.text }]}>Thanh toán thành công!</Text>
                <Text style={[styles.successText, { color: colors.secondaryText }]}>
                  Booking của bạn đã được xác nhận. Bạn có thể bắt đầu buổi tư vấn theo đúng lịch hẹn.
                </Text>
                <Button 
                  title="Xong" 
                  onPress={onClose} 
                  style={{ width: '100%', marginTop: 20 }}
                />
              </FadeInView>
            )}

            {/* Error / Failed */}
            {(phase === 'error' || phase === 'failed') && (
              <FadeInView style={styles.centeredState}>
                <AlertCircle size={60} color={colors.error} />
                <Text style={[styles.errorTitle, { color: colors.text }]}>
                  {phase === 'failed' ? 'Thanh toán thất bại' : 'Lỗi kết nối'}
                </Text>
                <Text style={[styles.errorText, { color: colors.secondaryText }]}>
                  {errorMsg || 'Không thể xử lý giao dịch lúc này. Vui lòng thử lại.'}
                </Text>
                <View style={styles.retryActions}>
                  <Button 
                    title={isRetrying ? "Đang thử lại..." : "Thử lại"} 
                    onPress={handleRetry}
                    loading={isRetrying}
                    style={{ flex: 1 }}
                  />
                  <Button 
                    title="Hủy" 
                    variant="outline"
                    onPress={onClose}
                    style={{ flex: 1 }}
                  />
                </View>
              </FadeInView>
            )}
          </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerInfo: { flex: 1 },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 60,
  },
  statusText: { marginTop: 16, fontWeight: '600' },
  qrSection: { alignItems: 'center' },
  amountCard: {
    width: '100%',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  amountLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  amountValue: { fontSize: 28, fontWeight: '900' },
  qrWrapper: {
    width: SCREEN_WIDTH * 0.65,
    height: SCREEN_WIDTH * 0.65,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  qrImage: { width: '100%', height: '100%' },
  qrPlaceholder: { alignItems: 'center', gap: 12 },
  codeRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  codeLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  codeValue: { fontSize: 16, fontWeight: '800' },
  pollIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  pollText: { fontSize: 14, fontWeight: '600' },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
  iconOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: { fontSize: 22, fontWeight: '900', marginBottom: 12 },
  successText: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  errorTitle: { fontSize: 20, fontWeight: '800', marginTop: 24, marginBottom: 8 },
  errorText: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  retryActions: { flexDirection: 'row', gap: 12, width: '100%' },
});
