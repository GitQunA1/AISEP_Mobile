import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ActivityIndicator, FlatList, RefreshControl, ScrollView, Dimensions, Alert 
} from 'react-native';
import { 
  MessageSquare, FileText, CheckCircle, Clock, 
  AlertCircle, CreditCard, ChevronRight, Calendar, RefreshCcw
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import Card from '../Card';
import FadeInView from '../FadeInView';
import bookingService from '../../services/bookingService';
import chatService from '../../services/chatService';

// Modals
import BookingDetailModal from '../booking/BookingDetailModal';
import BookingChatModal from '../booking/BookingChatModal';
import ConsultingReportModal from '../booking/ConsultingReportModal';
import UserReportModal from '../booking/UserReportModal';

const BOOKING_STATUS_LABELS = {
  0: { label: 'Chờ xác nhận', color: '#f59e0b' }, // Pending
  'Pending': { label: 'Chờ xác nhận', color: '#f59e0b' },
  1: { label: 'Chờ thanh toán', color: '#1d9bf0' }, // ApprovedAwaitingPayment
  'ApprovedAwaitingPayment': { label: 'Chờ thanh toán', color: '#1d9bf0' },
  2: { label: 'Đã xác nhận', color: '#1d9bf0' }, // Confirmed
  'Confirmed': { label: 'Đã xác nhận', color: '#1d9bf0' },
  3: { label: 'Hoàn thành', color: '#17bf63' }, // Completed
  'Completed': { label: 'Hoàn thành', color: '#17bf63' },
  4: { label: 'Đã hủy', color: '#f4212e' }, // Cancel
  'Cancel': { label: 'Đã hủy', color: '#f4212e' },
  5: { label: 'Không phản hồi', color: '#f4212e' }, // NoResponse
  'NoResponse': { label: 'Không phản hồi', color: '#f4212e' },
};

const FILTER_TABS = [
  { id: 'ApprovedAwaitingPayment', label: 'Chờ thanh toán' },
  { id: 'Pending', label: 'Chờ duyệt' },
  { id: 'Confirmed', label: 'Đã xác nhận' },
  { id: 'Completed', label: 'Hoàn thành' },
  { id: 'NoResponse', label: 'Không phản hồi' },
  { id: 'Cancel', label: 'Đã hủy' }
];

export default function StartupBookings({ user, onAction }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const ITEM_GAP = 10;
  const HORIZONTAL_PADDING = 20;
  const CARD_WIDTH = (SCREEN_WIDTH - (HORIZONTAL_PADDING * 2) - (ITEM_GAP * 3)) / 4;

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ApprovedAwaitingPayment');
  const [chatLoadingId, setChatLoadingId] = useState(null);

  // Modal States
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeChatSession, setActiveChatSession] = useState(null);

  const loadBookings = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await bookingService.getMyCustomerBookings('', '-Id', 1, 100);
      const items = response?.items ?? (Array.isArray(response) ? response : []);
      setBookings(items);
    } catch (error) {
      console.error('[StartupBookings] Failed to load bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleChat = async (booking) => {
    setChatLoadingId(booking.id || booking.bookingId);
    try {
      const result = await chatService.createOrGetBookingChat(booking.id || booking.bookingId);
      setSelectedBooking(booking);
      setActiveChatSession(result);
      setShowChatModal(true);
    } catch (error) {
      console.error('[StartupBookings] Chat access failed:', error);
      Alert.alert('Lỗi', 'Không thể khởi tạo phòng chat.');
    } finally {
      setChatLoadingId(null);
    }
  };

  const handleAction = (type, item) => {
    setSelectedBooking(item);
    if (type === 'detail') setShowDetailModal(true);
    if (type === 'chat') handleChat(item);
    if (type === 'report') setShowReportModal(true);
    if (type === 'complain') setShowComplaintModal(true);
    if (type === 'rebook') onAction?.('rebook', item);
    if (type === 'pay') onAction?.('pay', item);
  };

  const filteredBookings = bookings.filter(b => {
    if (filterStatus === 'ApprovedAwaitingPayment') return b.status === 1 || b.status === 'ApprovedAwaitingPayment';
    if (filterStatus === 'Pending') return b.status === 0 || b.status === 'Pending';
    if (filterStatus === 'Confirmed') return b.status === 2 || b.status === 'Confirmed';
    if (filterStatus === 'Completed') return b.status === 3 || b.status === 'Completed';
    if (filterStatus === 'NoResponse') return b.status === 5 || b.status === 'NoResponse';
    if (filterStatus === 'Cancel') return b.status === 4 || b.status === 'Cancel';
    return true;
  }).sort((a, b) => new Date(b.startTime || 0) - new Date(a.startTime || 0));

  const renderBookingItem = ({ item }) => {
    const statusInfo = BOOKING_STATUS_LABELS[item.status] || { label: String(item.status), color: colors.primary };
    const startTime = new Date(item.startTime);
    const endTime = new Date(item.endTime);
    const isChatLoading = chatLoadingId === (item.id || item.bookingId);

    return (
      <FadeInView>
        <Card style={styles.bookingCard}>
          <View style={styles.cardHeader}>
            <View style={styles.projectInfo}>
              <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {(item.projectName || 'D').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={[styles.projectName, { color: colors.text }]} numberOfLines={1}>
                  {item.projectName || 'Dự án'}
                </Text>
                <Text style={[styles.advisorName, { color: colors.primary }]}>
                  {item.advisorName || 'Cố vấn'}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { borderColor: statusInfo.color }]}>
              <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Calendar size={14} color={colors.secondaryText} />
              <Text style={[styles.metaText, { color: colors.secondaryText }]}>
                {startTime.toLocaleDateString('vi-VN')}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={14} color={colors.secondaryText} />
              <Text style={[styles.metaText, { color: colors.secondaryText }]}>
                {startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: colors.mutedBackground }]}
              onPress={() => handleAction('detail', item)}
            >
              <Text style={[styles.actionBtnText, { color: colors.text }]}>Chi tiết</Text>
              <ChevronRight size={14} color={colors.text} />
            </TouchableOpacity>

            {(item.status === 1 || item.status === 'ApprovedAwaitingPayment') && (
              <TouchableOpacity 
                style={[styles.actionBtn, styles.primaryBtn, { backgroundColor: colors.accentCyan }]}
                onPress={() => handleAction('pay', item)}
              >
                <CreditCard size={14} color="#fff" />
                <Text style={styles.primaryBtnText}>Thanh toán</Text>
              </TouchableOpacity>
            )}

            {(item.status === 2 || item.status === 'Confirmed') && (
              <TouchableOpacity 
                style={[styles.actionBtn, styles.primaryBtn, { backgroundColor: colors.primary }]}
                onPress={() => handleChat(item)}
                disabled={isChatLoading}
              >
                {isChatLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MessageSquare size={14} color="#fff" />
                    <Text style={styles.primaryBtnText}>Chat</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {(item.status === 2 || item.status === 'Confirmed' || item.status === 3 || item.status === 'Completed') && (
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: colors.mutedBackground }]}
                onPress={() => handleAction('report', item)}
              >
                <FileText size={14} color={colors.text} />
                <Text style={[styles.actionBtnText, { color: colors.text }]}>Báo cáo</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>
      </FadeInView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
          <View style={[styles.statsRow, { paddingHorizontal: HORIZONTAL_PADDING }]}>
            <StatItem 
              label="Tổng" 
              value={bookings.length} 
              color={colors.text} 
              colors={colors} 
              width={CARD_WIDTH} 
            />
            <StatItem 
              label="Xong" 
              value={bookings.filter(b => b.status === 3 || b.status === 'Completed').length} 
              color={colors.accentGreen} 
              colors={colors} 
              width={CARD_WIDTH} 
            />
            <StatItem 
              label="Duyệt" 
              value={bookings.filter(b => b.status === 2 || b.status === 'Confirmed').length} 
              color={colors.accentCyan} 
              colors={colors} 
              width={CARD_WIDTH} 
            />
            <StatItem 
              label="Hủy" 
              value={bookings.filter(b => [4, 5, 'Cancel', 'NoResponse'].includes(b.status)).length} 
              color={colors.error} 
              colors={colors} 
              width={CARD_WIDTH} 
            />
          </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTER_TABS.map(tab => (
            <TouchableOpacity 
              key={tab.id}
              onPress={() => setFilterStatus(tab.id)}
              style={[
                styles.filterTab, 
                { backgroundColor: filterStatus === tab.id ? colors.primary : colors.card, borderColor: colors.border }
              ]}
            >
              <Text style={[
                styles.filterTabText, 
                { color: filterStatus === tab.id ? '#fff' : colors.secondaryText }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: colors.secondaryText }}>Đang tải lịch tư vấn...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => (item.id || item.bookingId).toString()}
          renderItem={renderBookingItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadBookings(true)} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Clock size={48} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
                Không tìm thấy lịch tư vấn nào phù hợp.
              </Text>
            </View>
          }
        />
      )}

      {/* MODALS */}
      {showDetailModal && (
        <BookingDetailModal
          isVisible={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          booking={selectedBooking}
          onAction={handleAction}
          userRole="Startup"
        />
      )}

      {showChatModal && (
        <BookingChatModal
          isVisible={showChatModal}
          onClose={() => setShowChatModal(false)}
          booking={selectedBooking}
          session={activeChatSession}
        />
      )}

      {showReportModal && (
        <ConsultingReportModal
          isVisible={showReportModal}
          onClose={() => setShowReportModal(false)}
          bookingId={selectedBooking?.id || selectedBooking?.bookingId}
          userRole="Startup"
          advisorName={selectedBooking?.advisorName}
        />
      )}

      {showComplaintModal && (
        <UserReportModal
          isVisible={showComplaintModal}
          onClose={() => setShowComplaintModal(false)}
          bookingId={selectedBooking?.id || selectedBooking?.bookingId}
          targetUserId={selectedBooking?.advisorId}
          targetUserName={selectedBooking?.advisorName}
        />
      )}
    </View>
  );
}

function StatItem({ label, value, color, colors, width }) {
  return (
    <View style={[styles.statItem, { backgroundColor: colors.card, borderColor: colors.border, width }]}>
      <Text style={[styles.statLabel, { color: colors.secondaryText }]} numberOfLines={1}>{label}</Text>
      <Text style={[styles.statValue, { color }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100 },
  statsContainer: { paddingVertical: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statLabel: { fontSize: 10, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
  statValue: { fontSize: 16, fontWeight: '900' },
  filterContainer: { marginBottom: 16 },
  filterScroll: { paddingHorizontal: 20, gap: 8 },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterTabText: { fontSize: 13, fontWeight: '700' },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  bookingCard: { padding: 16, marginBottom: 16, borderRadius: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  projectInfo: { flexDirection: 'row', gap: 12, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '900' },
  projectName: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  advisorName: { fontSize: 14, fontWeight: '600' },
  statusBadge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  divider: { height: 1, marginVertical: 12, opacity: 0.5 },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, fontWeight: '500' },
  cardActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 6, 
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 
  },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
  primaryBtn: { paddingHorizontal: 16 },
  primaryBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 16 },
  emptyText: { fontSize: 15, textAlign: 'center' }
});
