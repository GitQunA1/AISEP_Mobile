import React from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  ScrollView, Dimensions, SafeAreaView 
} from 'react-native';
import { 
  X, Calendar, Clock, User, Briefcase, 
  CreditCard, ChevronRight, MessageSquare, AlertCircle, FileText 
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import Button from '../Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STATUS_CONFIG = {
  0: { label: 'Chờ xác nhận', color: '#f59e0b' },
  Pending: { label: 'Chờ xác nhận', color: '#f59e0b' },
  1: { label: 'Chờ thanh toán', color: '#1d9bf0' },
  ApprovedAwaitingPayment: { label: 'Chờ thanh toán', color: '#1d9bf0' },
  2: { label: 'Đã xác nhận', color: '#1d9bf0' },
  Confirmed: { label: 'Đã xác nhận', color: '#1d9bf0' },
  3: { label: 'Hoàn thành', color: '#17bf63' },
  Completed: { label: 'Hoàn thành', color: '#17bf63' },
  4: { label: 'Đã hủy', color: '#f4212e' },
  Cancel: { label: 'Đã hủy', color: '#f4212e' },
  5: { label: 'Không phản hồi', color: '#f4212e' },
  NoResponse: { label: 'Không phản hồi', color: '#f4212e' },
};

export default function BookingDetailModal({ isVisible, onClose, booking, onAction, userRole = 'Startup' }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  if (!booking) return null;

  const statusInfo = STATUS_CONFIG[booking.status] || { label: String(booking.status), color: colors.primary };
  const startTime = new Date(booking.startTime || Date.now());
  const endTime = new Date(booking.endTime || Date.now());
  
  const formattedDate = startTime.toLocaleDateString('vi-VN', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  const timeRange = `${startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} – ${endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

  const price = booking.price || booking.estimatedPrice || 0;
  const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  const isCancelled = [4, 5, 'Cancel', 'NoResponse'].includes(booking.status);

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
          {/* 1. Thông tin nhân sự */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>1. Thông tin nhân sự</Text>
            <View style={styles.infoGrid}>
              <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.profileLabel, { color: colors.secondaryText }]}>Cố vấn chuyên môn</Text>
                <Text style={[styles.profileName, { color: colors.primary }]}>{booking.advisorName || 'N/A'}</Text>
                <Text style={[styles.profileId, { color: colors.secondaryText }]}>Mã: {booking.advisorId || '—'}</Text>
              </View>
              
              <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.profileLabel, { color: colors.secondaryText }]}>
                  {userRole === 'Startup' ? 'Dự án của bạn' : 'Khách hàng / Startup'}
                </Text>
                <Text style={[styles.profileName, { color: colors.accentGreen }]}>
                  {booking.projectName || 'Dự án'}
                </Text>
                <Text style={[styles.profileId, { color: colors.secondaryText }]}>
                  {booking.projectId ? `Mã dự án: ${booking.projectId}` : booking.customerId ? `Mã KH: ${booking.customerId}` : '—'}
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
            </View>
          </View>

          {/* 3. Chi phí & Ghi chú */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>3. Chi phí & Ghi chú</Text>
            <View style={[styles.metaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
               <View style={styles.metaItem}>
                <CreditCard size={18} color={colors.primary} />
                <View style={styles.metaTextContainer}>
                  <Text style={[styles.metaLabel, { color: colors.secondaryText }]}>Tổng chi phí</Text>
                  <Text style={[styles.metaValue, { color: colors.primary, fontSize: 18, fontWeight: '800' }]}>
                    {price === 0 ? 'Miễn phí ✨' : formatPrice(price)}
                  </Text>
                </View>
              </View>

              {booking.note && (
                <View style={styles.noteBox}>
                  <Text style={[styles.metaLabel, { color: colors.secondaryText, marginBottom: 8 }]}>Ghi chú từ khách hàng</Text>
                  <Text style={[styles.noteText, { color: colors.text, fontStyle: 'italic' }]}>"{booking.note}"</Text>
                </View>
              )}
            </View>
          </View>

          {booking.rejectReason && isCancelled && (
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
          <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={onClose}>
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Đóng</Text>
          </TouchableOpacity>

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

          {userRole === 'Startup' && isCancelled && (
            <TouchableOpacity 
              style={[styles.primaryBtn, { backgroundColor: colors.accentCyan }]}
              onPress={() => onAction('rebook', booking)}
            >
              <ChevronRight size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Tìm cố vấn khác</Text>
            </TouchableOpacity>
          )}

          {userRole === 'Startup' && [2, 3, 'Confirmed', 'Completed'].includes(booking.status) && (
            <TouchableOpacity 
              style={[styles.secondaryBtn, { borderColor: colors.error + '40' }]}
              onPress={() => onAction('complain', booking)}
            >
              <AlertCircle size={18} color={colors.error} />
              <Text style={[styles.secondaryBtnText, { color: colors.error }]}>Khiếu nại</Text>
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
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 },
  infoGrid: { gap: 12 },
  profileCard: { padding: 16, borderRadius: 16, borderWidth: 1 },
  profileLabel: { fontSize: 11, fontWeight: '700', marginBottom: 6 },
  profileName: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  profileId: { fontSize: 12, fontWeight: '600' },
  metaCard: { padding: 16, borderRadius: 16, borderWidth: 1, gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  metaTextContainer: { flex: 1 },
  metaLabel: { fontSize: 11, fontWeight: '700' },
  metaValue: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  noteBox: { 
    marginTop: 16, 
    padding: 12, 
    borderRadius: 12, 
    backgroundColor: 'rgba(0,0,0,0.02)' 
  },
  noteText: { fontSize: 14, lineHeight: 22 },
  footer: {
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  primaryBtn: {
    flex: 1,
    minWidth: 140,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  secondaryBtn: {
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '700' },
});
