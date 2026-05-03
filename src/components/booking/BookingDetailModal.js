import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  ScrollView, Dimensions, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  X, Calendar, Clock, User, Briefcase, 
  CreditCard, ChevronRight, MessageSquare, AlertCircle, 
  FileText, Star, ShieldCheck, Gavel, Info, Search, Sparkles
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import Button from '../Button';
import userReportService from '../../services/userReportService';
import consultingReportService from '../../services/consultingReportService';
import reviewService from '../../services/reviewService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STATUS_CONFIG = {
  0: { label: 'Chờ xác nhận', color: '#f59e0b' },
  'Pending': { label: 'Chờ xác nhận', color: '#f59e0b' },
  1: { label: 'Chờ thanh toán', color: '#1d9bf0' },
  'ApprovedAwaitingPayment': { label: 'Chờ thanh toán', color: '#1d9bf0' },
  2: { label: 'Đã xác nhận', color: '#1d9bf0' },
  'Confirmed': { label: 'Đã xác nhận', color: '#1d9bf0' },
  3: { label: 'Hoàn thành', color: '#17bf63' },
  'Completed': { label: 'Hoàn thành', color: '#17bf63' },
  4: { label: 'Khiếu nại chấp nhận', color: '#17bf63' },
  'ComplaintAccepted': { label: 'Khiếu nại chấp nhận', color: '#17bf63' },
  5: { label: 'Khiếu nại từ chối', color: '#f4212e' },
  'ComplaintRejected': { label: 'Khiếu nại từ chối', color: '#f4212e' },
  6: { label: 'Đã hủy', color: '#f4212e' },
  'Cancel': { label: 'Đã hủy', color: '#f4212e' },
  7: { label: 'Không phản hồi', color: '#f4212e' },
  'NoResponse': { label: 'Không phản hồi', color: '#f4212e' },
  8: { label: 'Quá hạn báo cáo', color: '#f4212e' },
  'ConsultingReportOverdue': { label: 'Quá hạn báo cáo', color: '#f4212e' },
  9: { label: 'Đang khiếu nại', color: '#1d9bf0' },
  'ComplaintPending': { label: 'Đang khiếu nại', color: '#1d9bf0' },
};

export default function BookingDetailModal({ isVisible, onClose, booking, onAction, userRole = 'Startup' }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const [existingReport, setExistingReport] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  const [consultationReport, setConsultationReport] = useState(null);
  const [loadingExtra, setLoadingExtra] = useState(false);

  useEffect(() => {
    if (isVisible && booking) {
      fetchExtraData();
    } else {
      setExistingReport(null);
      setExistingReview(null);
      setConsultationReport(null);
    }
  }, [isVisible, booking]);

  const fetchExtraData = async () => {
    setLoadingExtra(true);
    try {
      const bookingId = booking.id || booking.bookingId;
      
      const [reportsData, cReport, reviewsData] = await Promise.all([
        (async () => {
          try {
            if (userRole === 'Staff') return await userReportService.getAllReports();
            if (userRole === 'Advisor') return await userReportService.getMyReportsAsReported();
            return await userReportService.getMyReportsAsReporter();
          } catch (err) { return null; }
        })(),
        (async () => {
          try {
            return await consultingReportService.getReportByBookingId(bookingId);
          } catch (err) { return null; }
        })(),
        (async () => {
          try {
            if (![3, 'Completed'].includes(booking.status)) return null;
            if (['Startup', 'Investor'].includes(userRole)) {
              return await reviewService.getMyReviews();
            } else {
              const advisorId = booking.advisorId || booking.advisor?.id;
              if (advisorId) return await reviewService.getReviewsByAdvisor(advisorId);
            }
            return null;
          } catch (err) { return null; }
        })()
      ]);

      if (reportsData) {
        const items = Array.isArray(reportsData) ? reportsData : (reportsData?.items || []);
        setExistingReport(items.find(r => String(r.bookingId) === String(bookingId)));
      }

      if (cReport && cReport.consultingReportId) {
        setConsultationReport(cReport);
      }

      if (reviewsData) {
        const items = Array.isArray(reviewsData) ? reviewsData : (reviewsData?.items || []);
        setExistingReview(items.find(r => String(r.bookingId) === String(bookingId)));
      }
    } catch (error) {
      console.error('Error fetching extra data:', error);
    } finally {
      setLoadingExtra(false);
    }
  };

  if (!booking) return null;

  const statusInfo = STATUS_CONFIG[booking.status] || { label: String(booking.status), color: colors.primary };
  const startTime = new Date(booking.startTime || Date.now());
  const endTime = new Date(booking.endTime || Date.now());
  
  const formattedDate = startTime.toLocaleDateString('vi-VN', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  const timeRange = `${startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} – ${endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

  const isFreeRebook = booking.isFreeRebookFromComplaint || booking.IsFreeRebookFromComplaint;
  const isPremiumFree = booking.usedPremiumFreeQuota || booking.UsedPremiumFreeQuota;
  const isFree = isFreeRebook || isPremiumFree;

  const showAsFreeToUser = isFree && ['Startup', 'Investor'].includes(userRole);
  const price = showAsFreeToUser ? 0 : (booking.price || booking.estimatedPrice || 0);
  const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  const renderBanner = () => {
    const status = booking.status;
    const isCustomer = ['Startup', 'Investor'].includes(userRole);
    const isAdvisor = userRole === 'Advisor';
    const isStaff = userRole === 'Staff';
    
    if (status === 8 || status === 'ConsultingReportOverdue') {
      return (
        <View style={[styles.banner, { backgroundColor: '#fef2f2', borderColor: '#fee2e2' }]}>
          <AlertCircle size={20} color="#ef4444" />
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Advisor đã quá hạn nộp báo cáo (24h)</Text>
            <Text style={styles.bannerDesc}>
              {isCustomer && "Hệ thống ghi nhận Advisor chưa nộp báo cáo kết quả đúng hạn."}
              {isAdvisor && "Bạn đã bỏ lỡ thời hạn nộp báo cáo (24h sau khi kết thúc). Vui lòng nộp ngay."}
              {isStaff && "Advisor này đã quá hạn nộp báo cáo. Hệ thống đã đánh dấu overdue."}
            </Text>
          </View>
        </View>
      );
    }

    if (status === 9 || status === 'ComplaintPending') {
      return (
        <View style={[styles.banner, { backgroundColor: '#eff6ff', borderColor: '#dbeafe' }]}>
          <Info size={20} color="#3b82f6" />
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Đang trong quá trình khiếu nại</Text>
            <Text style={styles.bannerDesc}>
              {isCustomer && "Yêu cầu khiếu nại của bạn đang được Staff xem xét."}
              {isAdvisor && "Khách hàng đã gửi khiếu nại. Staff đang thực hiện đối soát."}
              {isStaff && "Booking này đang có khiếu nại chưa được giải quyết."}
            </Text>
          </View>
        </View>
      );
    }

    if (status === 4 || status === 'ComplaintAccepted') {
      return (
        <View style={[styles.banner, { backgroundColor: '#f0fdf4', borderColor: '#dcfce7' }]}>
          <ShieldCheck size={20} color="#22c55e" />
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Khiếu nại đã được chấp thuận</Text>
            <Text style={styles.bannerDesc}>
              {isCustomer && "Staff đã xác nhận khiếu nại hợp lệ. Bạn đã được hoàn trả 1 lượt booking."}
              {isAdvisor && "Khiếu nại từ khách hàng đã được xác nhận. Lượt booking đã được hoàn trả."}
              {isStaff && "Khiếu nại đã được giải quyết thành công (Valid)."}
            </Text>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerTitleGrp}>
            <Text style={[styles.headerTitleText, { color: colors.text }]}>
              Booking #{booking.id || booking.bookingId}
            </Text>
            <View style={[styles.badge, { borderColor: statusInfo.color + '40', backgroundColor: statusInfo.color + '15' }]}>
              <Text style={[styles.badgeText, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {renderBanner()}

          {/* 1. Thông tin nhân sự */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>1. Thông tin nhân sự</Text>
            <View style={styles.infoGrid}>
              <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.profileLabel, { color: colors.secondaryText }]}>Cố vấn chuyên môn</Text>
                <Text style={[styles.profileName, { color: colors.primary }]}>{booking.advisorName || 'N/A'}</Text>
              </View>
              
              <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.profileLabel, { color: colors.secondaryText }]}>
                  {userRole === 'Startup' ? 'Dự án / Khách hàng' : 'Nhà đầu tư / Khách hàng'}
                </Text>
                <Text style={[styles.profileName, { color: colors.accentGreen }]}>
                  {booking.customerName || booking.projectName || 'Khách hàng'}
                </Text>
              </View>
            </View>
          </View>

          {/* 2. Thời gian tư vấn */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>2. Thời gian tư vấn</Text>
            <View style={[styles.metaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.metaItem}>
                <Calendar size={18} color={colors.accentCyan} />
                <View style={styles.metaTextContainer}>
                  <Text style={[styles.metaLabel, { color: colors.secondaryText }]}>Ngày tư vấn</Text>
                  <Text style={[styles.metaValue, { color: colors.text }]}>{formattedDate}</Text>
                </View>
              </View>
              
              <View style={styles.metaItem}>
                <Clock size={18} color={colors.accentCyan} />
                <View style={styles.metaTextContainer}>
                  <Text style={[styles.metaLabel, { color: colors.secondaryText }]}>Khung giờ chi tiết</Text>
                  <Text style={[styles.metaValue, { color: colors.text }]}>{timeRange}</Text>
                </View>
              </View>
              
              <View style={styles.metaItem}>
                <Clock size={18} color={colors.accentCyan} />
                <View style={styles.metaTextContainer}>
                  <Text style={[styles.metaLabel, { color: colors.secondaryText }]}>Thời lượng</Text>
                  <Text style={[styles.metaValue, { color: colors.text }]}>{booking.slotCount || 1} giờ tư vấn trực tuyến</Text>
                </View>
              </View>

              {booking.note && (
                <View style={styles.noteBox}>
                  <Text style={[styles.metaLabel, { color: colors.secondaryText, marginBottom: 8 }]}>Ghi chú</Text>
                  <Text style={[styles.noteText, { color: colors.text, fontStyle: 'italic' }]}>"{booking.note}"</Text>
                </View>
              )}
            </View>
          </View>

          {/* 3. Chi phí */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>3. Chi phí</Text>
            <View style={[styles.metaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
               <View style={styles.metaItem}>
                <CreditCard size={18} color={colors.primary} />
                <View style={styles.metaTextContainer}>
                  <Text style={[styles.metaLabel, { color: colors.secondaryText }]}>Chi phí tư vấn</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {price === 0 && <Sparkles size={16} color="#eab308" fill="#eab308" />}
                    <Text style={[styles.metaValue, { color: price === 0 ? '#eab308' : colors.primary, fontSize: 18, fontWeight: '800' }]}>
                      {price === 0 ? 'Miễn phí' : formatPrice(price)}
                    </Text>
                  </View>
                </View>
              </View>

              {isFreeRebook && (
                <View style={styles.freeDetailRow}>
                  <ShieldCheck size={16} color="#10b981" />
                  <Text style={[styles.freeDetailText, { color: colors.secondaryText }]}>Đặt lịch lại miễn phí (Từ khiếu nại trước đó)</Text>
                </View>
              )}
              {isPremiumFree && (
                <View style={styles.freeDetailRow}>
                  <Gavel size={16} color="#eab308" />
                  <Text style={[styles.freeDetailText, { color: colors.secondaryText }]}>Booking miễn phí (Từ gói đăng ký Premium)</Text>
                </View>
              )}
            </View>
          </View>

          {booking.rejectReason && [6, 7, 'Cancel', 'NoResponse'].includes(booking.status) && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.error }]}>Lý do từ chối</Text>
              <View style={[styles.noteBox, { borderLeftColor: colors.error, borderLeftWidth: 4, backgroundColor: colors.error + '10' }]}>
                 <Text style={[styles.noteText, { color: colors.text }]}>{booking.rejectReason}</Text>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Footer Actions */}
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.footerScroll}
          >
            <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={onClose}>
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Đóng</Text>
            </TouchableOpacity>

            {loadingExtra && (
              <View style={{ justifyContent: 'center', paddingHorizontal: 10 }}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}

            {userRole === 'Startup' && (booking.status === 1 || booking.status === 'ApprovedAwaitingPayment') && (
              <TouchableOpacity 
                style={[styles.primaryBtn, { backgroundColor: colors.accentGreen }]}
                onPress={() => onAction('pay', booking)}
              >
                <CreditCard size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Thanh toán</Text>
              </TouchableOpacity>
            )}

            {(booking.status === 2 || booking.status === 'Confirmed') && (
              <TouchableOpacity 
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                onPress={() => onAction('chat', booking)}
              >
                <MessageSquare size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Vào phòng chat</Text>
              </TouchableOpacity>
            )}

            {['Startup', 'Investor'].includes(userRole) && [6, 7, 8, 'Cancel', 'NoResponse', 'ConsultingReportOverdue'].includes(booking.status) && (
              <TouchableOpacity 
                style={[styles.primaryBtn, { backgroundColor: colors.accentCyan }]}
                onPress={() => onAction('rebook', booking)}
              >
                <Search size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Tìm cố vấn khác</Text>
              </TouchableOpacity>
            )}

            {existingReport && (
              <TouchableOpacity 
                style={[styles.secondaryBtn, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}
                onPress={() => onAction('viewComplaint', existingReport)}
              >
                <Eye size={18} color={colors.primary} />
                <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>Xem khiếu nại</Text>
              </TouchableOpacity>
            )}

            {!existingReport && ['Startup', 'Investor'].includes(userRole) && [2, 'Confirmed'].includes(booking.status) && (
              <TouchableOpacity 
                style={[styles.secondaryBtn, { borderColor: colors.error + '40' }]}
                onPress={() => onAction('complain', booking)}
              >
                <AlertCircle size={18} color={colors.error} />
                <Text style={[styles.secondaryBtnText, { color: colors.error }]}>Khiếu nại</Text>
              </TouchableOpacity>
            )}

            {['Startup', 'Investor', 'Staff'].includes(userRole) && (booking.status === 3 || booking.status === 'Completed' || consultationReport) && (
              <TouchableOpacity 
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                onPress={() => onAction('report', booking)}
              >
                <FileText size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Xem báo cáo</Text>
              </TouchableOpacity>
            )}

            {['Startup', 'Investor'].includes(userRole) && (booking.status === 3 || booking.status === 'Completed') && (
              <>
                {!existingReview ? (
                  <TouchableOpacity 
                    style={[styles.primaryBtn, { backgroundColor: '#f59e0b' }]}
                    onPress={() => onAction('rate', booking)}
                  >
                    <Star size={18} color="#fff" fill="#fff" />
                    <Text style={styles.primaryBtnText}>Đánh giá</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[styles.secondaryBtn, { borderColor: '#f59e0b' }]}
                    onPress={() => onAction('rate', { ...booking, existingReview })}
                  >
                    <Star size={18} color="#f59e0b" fill="#f59e0b" />
                    <Text style={[styles.secondaryBtnText, { color: '#f59e0b' }]}>Xem đánh giá</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {booking.projectId && (
              <TouchableOpacity 
                style={[styles.primaryBtn, { backgroundColor: colors.accentGreen }]}
                onPress={() => onAction('viewProject', booking)}
              >
                <Briefcase size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Xem dự án</Text>
              </TouchableOpacity>
            )}

            {userRole === 'Advisor' && (booking.status === 2 || booking.status === 'Confirmed') && (
              <TouchableOpacity 
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                onPress={() => onAction('report', booking)}
              >
                <FileText size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Viết báo cáo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
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
  headerTitleGrp: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitleText: { fontSize: 18, fontWeight: '800' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 20 },
  banner: { 
    flexDirection: 'row', 
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 1, 
    marginBottom: 24, 
    gap: 12 
  },
  bannerContent: { flex: 1 },
  bannerTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4, color: '#111827' },
  bannerDesc: { fontSize: 13, lineHeight: 18, color: '#4b5563' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 },
  infoGrid: { gap: 12 },
  profileCard: { padding: 16, borderRadius: 16, borderWidth: 1 },
  profileLabel: { fontSize: 11, fontWeight: '700', marginBottom: 6 },
  profileName: { fontSize: 16, fontWeight: '800' },
  metaCard: { padding: 16, borderRadius: 16, borderWidth: 1, gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  metaTextContainer: { flex: 1 },
  metaLabel: { fontSize: 11, fontWeight: '700' },
  metaValue: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  noteBox: { 
    marginTop: 8, 
    padding: 12, 
    borderRadius: 12, 
    backgroundColor: 'rgba(0,0,0,0.03)' 
  },
  noteText: { fontSize: 14, lineHeight: 22 },
  freeDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4, width: '100%' },
  freeDetailText: { fontSize: 12, fontWeight: '600', flex: 1 },
  footer: {
    paddingVertical: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
  },
  footerScroll: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center'
  },
  primaryBtn: {
    minWidth: 120,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  secondaryBtn: {
    minWidth: 80,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '700' },
});
