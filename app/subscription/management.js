import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Modal, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, Crown, CheckCircle2, AlertCircle, Zap, Eye, Ticket, Sparkles, Check, X, QrCode, Copy
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import THEME from '../../src/constants/Theme';
import Button from '../../src/components/Button';
import subscriptionService from '../../src/services/subscriptionService';
import paymentService from '../../src/services/paymentService';

export default function SubscriptionManagementScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  const insets = useSafeAreaInsets();

  const [subscription, setSubscription] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Payment Modal State
  const [checkoutData, setCheckoutData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPackageName, setSelectedPackageName] = useState('');
  const [paymentPhase, setPaymentPhase] = useState('qr'); // qr | success | failed
  const pollRef = useRef(null);

  const fetchSubscriptionData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [subData, pkgData] = await Promise.all([
        subscriptionService.getMySubscription(),
        paymentService.getStartupPackages() // Assuming currently mobile only supports startup buying
      ]);
      setSubscription(subData);
      setPackages(pkgData?.items || pkgData || []);
    } catch (error) {
      console.error('Failed to fetch subscription data:', error);
      if (!isSilent) {
        Alert.alert('Lỗi', 'Không thể tải thông tin gói dịch vụ. Vui lòng thử lại sau.');
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptionData();
    return () => stopPolling();
  }, [fetchSubscriptionData]);

  const handleCheckout = async (pkg) => {
    setIsProcessing(true);
    setSelectedPackageName(pkg.packageName);
    try {
      const result = await paymentService.checkoutSubscription(pkg.packageId);
      setCheckoutData(result);
      setPaymentPhase('qr');
      startPolling(result.transactionId);
    } catch (error) {
      console.error('Checkout failed:', error);
      Alert.alert('Lỗi thanh toán', 'Không thể khởi tạo thanh toán. Vui lòng thử lại sau.');
    } finally {
      setIsProcessing(false);
    }
  };

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback((transactionId) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const statusRes = await paymentService.getTransactionStatus(transactionId);
        const actualStatus = statusRes?.status || statusRes?.data?.status;
        
        if (actualStatus === 'Success' || actualStatus === 'Completed' || actualStatus === 2) {
          stopPolling();
          setPaymentPhase('success');
          fetchSubscriptionData(true);
        } else if (actualStatus === 'Failed' || actualStatus === 3) {
          stopPolling();
          setPaymentPhase('failed');
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);
  }, [stopPolling, fetchSubscriptionData]);

  const handleModalClose = () => {
    stopPolling();
    setCheckoutData(null);
  };

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Đã sao chép', 'Đã sao chép nội dung vào khay nhớ tạm.');
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Gói dịch vụ</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const isPremium = (subscription?.status === 1 || subscription?.status === 'Active') && 
                    subscription?.packageName && 
                    !subscription.packageName.toLowerCase().includes('cơ bản') && 
                    !subscription.packageName.toLowerCase().includes('basic');

  const isLocked = !subscription || subscription.data === null || !subscription.packageName;
  const activePackage = packages.find(p => p.packageId === subscription?.packageId);

  const UsageItem = ({ icon, label, used, total, isLocked, isPremium, hideProgress }) => {
    const percentage = total > 0 ? (used / total) * 100 : 0;
    
    return (
      <View style={[styles.usageItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.usageHeader}>
          <View style={styles.usageLabelRow}>
            <View style={[styles.iconBox, { backgroundColor: colors.mutedBackground }]}>
              {isLocked ? <Crown size={18} color={colors.secondaryText} /> : icon}
            </View>
            <View style={styles.usageTexts}>
              <Text style={[styles.usageTitle, { color: colors.text }]}>{label}</Text>
              <Text style={[styles.usageSubtitle, { color: colors.secondaryText }]}>
                {isLocked ? 'Tính năng Gói dịch vụ' : 'Hạn mức tháng'}
              </Text>
            </View>
          </View>
          <View style={styles.usageValueBox}>
            {isLocked ? (
              <Text style={[styles.lockedText, { color: colors.primary }]}>CHƯA MỞ KHÓA</Text>
            ) : (
              <Text style={[styles.usageValue, { color: colors.text }]}>
                {used}/{total}
              </Text>
            )}
          </View>
        </View>

        {!hideProgress && (
          <View style={[styles.progressBar, { backgroundColor: colors.mutedBackground }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: isLocked ? 'transparent' : (isPremium ? colors.primary : colors.text),
                  width: `${isLocked ? 0 : Math.min(percentage, 100)}%` 
                }
              ]} 
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Quản lý gói dịch vụ</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Current Plan Overview */}
        <View style={[styles.overviewCard, { backgroundColor: colors.card, borderColor: isPremium ? colors.primary + '50' : colors.border, borderWidth: isPremium ? 2 : 1 }]}>
          <View style={[styles.planBadge, { backgroundColor: isPremium ? colors.primary + '20' : colors.mutedBackground }]}>
            <Text style={[styles.planBadgeText, { color: isPremium ? colors.primary : colors.text }]}>
              {subscription?.packageName || 'Gói Miễn phí'}
            </Text>
          </View>
          
          <Text style={[styles.planTitle, { color: colors.text }]}>
            Bạn đang dùng gói {subscription?.packageName || 'Miễn phí'}
          </Text>

          <View style={styles.planDetails}>
            {(subscription && (subscription.status === 1 || subscription.status === 'Active')) ? (
              <View>
                <Text style={[styles.detailText, { color: colors.secondaryText }]}>
                  Hết hạn vào: <Text style={{ fontWeight: '700', color: colors.text }}>{new Date(subscription.endDate).toLocaleDateString('vi-VN')}</Text>
                </Text>
                <Text style={[styles.detailText, { color: colors.secondaryText }]}>
                  Còn lại: <Text style={{ fontWeight: '700', color: '#60a5fa' }}>{Math.max(0, Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)))} ngày</Text>
                </Text>
              </View>
            ) : (
              <Text style={[styles.detailText, { color: colors.secondaryText }]}>
                Nâng cấp ngay để mở khóa các phân tích AI chuyên sâu và tương tác không giới hạn.
              </Text>
            )}
          </View>

          <View style={styles.statusRow}>
            {(subscription && (subscription.status === 1 || subscription.status === 'Active')) ? (
              <>
                <CheckCircle2 size={16} color="#10b981" />
                <Text style={[styles.statusText, { color: '#10b981' }]}>Gói đang hoạt động</Text>
              </>
            ) : (
              <>
                <AlertCircle size={16} color={colors.secondaryText} />
                <Text style={[styles.statusText, { color: colors.secondaryText }]}>Hãy nâng cấp để có thêm quyền lợi</Text>
              </>
            )}
          </View>
        </View>

        {/* Real-time Usage Limits */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Hạn mức sử dụng tháng này</Text>
        <View style={styles.usageContainer}>
          <UsageItem 
            icon={<Zap size={18} color={colors.primary} />} 
            label="Yêu cầu AI (Phân tích)" 
            used={subscription?.usedAiRequests ?? 0} 
            total={activePackage?.maxAiRequests ?? 0} 
            isPremium={isPremium}
            isLocked={isLocked}
          />
          <UsageItem 
            icon={<Eye size={18} color={colors.primary} />} 
            label="Lượt xem dự án" 
            used={subscription?.usedProjectViews ?? 0} 
            total={activePackage?.maxProjectViews ?? 0} 
            isPremium={isPremium}
            isLocked={isLocked}
          />
          <UsageItem 
            icon={<Ticket size={18} color={colors.primary} />} 
            label="Booking miễn phí" 
            used={activePackage ? (activePackage.freeBookingCount - (subscription?.remainingFreeBookings ?? 0)) : 0} 
            total={activePackage?.freeBookingCount ?? 0} 
            isPremium={isPremium}
            isLocked={isLocked}
          />
        </View>

        {/* Upgrade Options */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Mở khóa thêm quyền lợi</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.secondaryText }]}>Chọn gói phù hợp nhất với nhu cầu tăng trưởng của bạn</Text>
        
        {packages.map((pkg) => {
          const isCurrent = subscription?.packageId === pkg.packageId || (subscription?.packageName === pkg.packageName);
          const isSpecial = pkg.price > 0;
          
          return (
            <View key={pkg.packageId} style={[styles.pricingCard, { backgroundColor: colors.card, borderColor: isSpecial ? colors.primary + '50' : colors.border }]}>
              {isSpecial && <View style={styles.featuredBadge}><Text style={styles.featuredBadgeText}>Phổ biến nhất</Text></View>}
              <Text style={[styles.pkgName, { color: colors.text }]}>{pkg.packageName}</Text>
              <View style={styles.priceRow}>
                <Text style={[styles.priceValue, { color: colors.text }]}>{pkg.price.toLocaleString('vi-VN')}</Text>
                <Text style={[styles.pricePeriod, { color: colors.secondaryText }]}> đ / {pkg.durationMonths} tháng</Text>
              </View>
              <Text style={[styles.pkgDesc, { color: colors.secondaryText }]}>{pkg.description}</Text>
              
              <View style={styles.featuresList}>
                <View style={styles.featureRow}>
                  <Check size={16} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.featureText, { color: colors.text }]}>{pkg.maxAiRequests} yêu cầu phân tích AI</Text>
                </View>
                <View style={styles.featureRow}>
                  <Check size={16} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.featureText, { color: colors.text }]}>{pkg.maxProjectViews} lượt xem chi tiết dự án</Text>
                </View>
                <View style={styles.featureRow}>
                  <Check size={16} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.featureText, { color: colors.text }]}>{pkg.freeBookingCount} lượt tư vấn miễn phí</Text>
                </View>
              </View>

              <Button 
                title={isCurrent ? `Đang sử dụng` : 'Nâng cấp ngay'} 
                onPress={() => handleCheckout(pkg)}
                disabled={isCurrent || isProcessing || pkg.price === 0}
                style={[
                  styles.upgradeBtn, 
                  isCurrent ? { backgroundColor: colors.mutedBackground } : (isSpecial ? { backgroundColor: colors.primary } : {})
                ]}
                textStyle={isCurrent ? { color: colors.text } : { color: '#fff' }}
              />
            </View>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Payment Modal */}
      <Modal visible={!!checkoutData} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Thanh toán gói dịch vụ</Text>
                <Text style={[styles.modalSubtitle, { color: colors.secondaryText }]}>Gói {selectedPackageName}</Text>
              </View>
              <TouchableOpacity onPress={handleModalClose} style={[styles.closeBtn, { backgroundColor: colors.mutedBackground }]}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {paymentPhase === 'qr' && checkoutData && (
                <View style={styles.qrSection}>
                  <View style={styles.amountBox}>
                    <Text style={[styles.amountLabel, { color: colors.secondaryText }]}>Tổng tiền thanh toán</Text>
                    <Text style={[styles.amountValue, { color: colors.primary }]}>{checkoutData.amount?.toLocaleString('vi-VN')} VND</Text>
                  </View>

                  <View style={[styles.qrContainer, { backgroundColor: '#fff', borderColor: colors.border }]}>
                    {checkoutData.qrCodeUrl ? (
                      <Image source={{ uri: checkoutData.qrCodeUrl }} style={styles.qrImage} resizeMode="contain" />
                    ) : (
                      <View style={styles.qrPlaceholder}>
                        <QrCode size={64} color={colors.secondaryText} />
                        <Text style={{ color: colors.secondaryText, marginTop: 10 }}>QR không khả dụng</Text>
                      </View>
                    )}
                  </View>

                  <View style={[styles.paymentCodeBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.codeLabel, { color: colors.secondaryText }]}>Nội dung chuyển khoản</Text>
                    <View style={styles.codeRow}>
                      <Text style={[styles.codeValue, { color: colors.text }]}>{checkoutData.paymentCode}</Text>
                      <TouchableOpacity onPress={() => copyToClipboard(checkoutData.paymentCode)} style={styles.copyBtn}>
                        <Copy size={18} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.pollIndicator}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.pollText, { color: colors.secondaryText }]}>Đang chờ xác nhận giao dịch từ ngân hàng...</Text>
                  </View>
                  <Text style={[styles.instruction, { color: colors.secondaryText }]}>
                    Lưu ý: Quét mã QR bằng ứng dụng ngân hàng và giữ nguyên nội dung chuyển khoản.
                  </Text>
                </View>
              )}

              {paymentPhase === 'success' && (
                <View style={styles.statusSection}>
                  <CheckCircle2 size={80} color="#10b981" style={{ marginBottom: 20 }} />
                  <Text style={[styles.statusTitle, { color: colors.text }]}>Kích hoạt thành công!</Text>
                  <Text style={[styles.statusText, { color: colors.secondaryText }]}>
                    Gói {selectedPackageName} của bạn đã được kích hoạt. Bạn có thể sử dụng các tính năng Premium ngay bây giờ.
                  </Text>
                  <Button title="Hoàn tất" onPress={handleModalClose} style={{ width: '100%', marginTop: 30 }} />
                </View>
              )}

              {paymentPhase === 'failed' && (
                <View style={styles.statusSection}>
                  <AlertCircle size={80} color={colors.error} style={{ marginBottom: 20 }} />
                  <Text style={[styles.statusTitle, { color: colors.text }]}>Giao dịch thất bại</Text>
                  <Text style={[styles.statusText, { color: colors.secondaryText }]}>
                    Đã có lỗi xảy ra trong quá trình xử lý. Tiền của bạn sẽ được hoàn trả nếu giao dịch đã bị trừ.
                  </Text>
                  <Button title="Quay lại" onPress={handleModalClose} style={{ width: '100%', marginTop: 30 }} />
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scrollContent: { padding: 20 },
  
  overviewCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 32,
  },
  planBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  planBadgeText: { fontSize: 13, fontWeight: '700' },
  planTitle: { fontSize: 20, fontWeight: '800', marginBottom: 12 },
  planDetails: { marginBottom: 20 },
  detailText: { fontSize: 14, lineHeight: 22, marginBottom: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { fontSize: 13, fontWeight: '600' },

  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  sectionSubtitle: { fontSize: 14, marginBottom: 20 },
  
  usageContainer: { gap: 12, marginBottom: 16 },
  usageItem: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  usageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  usageLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  usageTexts: { gap: 2 },
  usageTitle: { fontSize: 15, fontWeight: '700' },
  usageSubtitle: { fontSize: 12 },
  usageValueBox: { alignItems: 'flex-end' },
  usageValue: { fontSize: 16, fontWeight: '800' },
  lockedText: { fontSize: 11, fontWeight: '800' },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  pricingCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  featuredBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomLeftRadius: 16,
  },
  featuredBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  pkgName: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  priceValue: { fontSize: 28, fontWeight: '900' },
  pricePeriod: { fontSize: 15, fontWeight: '600' },
  pkgDesc: { fontSize: 14, lineHeight: 22, marginBottom: 24 },
  featuresList: { gap: 12, marginBottom: 24 },
  featureRow: { flexDirection: 'row', alignItems: 'center' },
  featureText: { fontSize: 14, fontWeight: '500' },
  upgradeBtn: { width: '100%' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalSubtitle: { fontSize: 13, marginTop: 4 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modalScroll: { padding: 20, flexGrow: 1 },
  
  qrSection: { alignItems: 'center' },
  amountBox: { alignItems: 'center', marginBottom: 20 },
  amountLabel: { fontSize: 13, marginBottom: 4 },
  amountValue: { fontSize: 24, fontWeight: '900' },
  qrContainer: { width: 200, height: 200, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 20, padding: 8 },
  qrImage: { width: '100%', height: '100%' },
  qrPlaceholder: { alignItems: 'center' },
  paymentCodeBox: { width: '100%', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  codeLabel: { fontSize: 12, marginBottom: 6 },
  codeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  codeValue: { fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  copyBtn: { padding: 6, backgroundColor: 'rgba(29, 155, 240, 0.1)', borderRadius: 8 },
  pollIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  pollText: { fontSize: 13, fontWeight: '500' },
  instruction: { fontSize: 12, textAlign: 'center', lineHeight: 18 },

  statusSection: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  statusTitle: { fontSize: 24, fontWeight: '800', marginBottom: 12 },
  statusText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
