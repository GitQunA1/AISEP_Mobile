import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ActivityIndicator, FlatList, RefreshControl, ScrollView, Dimensions, Alert 
} from 'react-native';
import { 
  MessageSquare, FileText, CheckCircle, Clock, 
  AlertCircle, CreditCard, ChevronRight, Calendar, RefreshCcw, Crown, Sparkles, Star, Search, Briefcase
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useRouter } from 'expo-router';
import Card from '../Card';
import FadeInView from '../FadeInView';
import bookingService from '../../services/bookingService';
import chatService from '../../services/chatService';

// Modals
import BookingDetailModal from '../booking/BookingDetailModal';
import BookingChatModal from '../booking/BookingChatModal';
import ConsultingReportModal from '../booking/ConsultingReportModal';
import UserReportModal from '../booking/UserReportModal';
import ReviewModal from '../booking/ReviewModal';

const BOOKING_STATUS_LABELS = {
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

const FILTER_TABS = [
  { id: 'All', label: 'Tất cả' },
  { id: 'ApprovedAwaitingPayment', label: 'Chờ thanh toán' },
  { id: 'Pending', label: 'Chờ duyệt' },
  { id: 'Confirmed', label: 'Đang tư vấn' },
  { id: 'Completed', label: 'Hoàn thành' },
  { id: 'ComplaintPending', label: 'Đang khiếu nại' },
  { id: 'Failed', label: 'Đã hủy/Quá hạn' }
];

export default function StartupBookings({ user, onAction, refreshKey }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  const router = useRouter();
  const { quota, isPremium } = useSubscription();
  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const ITEM_GAP = 10;
  const HORIZONTAL_PADDING = 20;
  const CARD_WIDTH = (SCREEN_WIDTH - (HORIZONTAL_PADDING * 2) - (ITEM_GAP * 3)) / 4;

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [chatLoadingId, setChatLoadingId] = useState(null);

  // Modal States
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeChatSession, setActiveChatSession] = useState(null);
  const [viewOnlyComplaint, setViewOnlyComplaint] = useState(null);

  const loadBookings = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Sort by Id descending to get newest first as a baseline
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
  }, [loadBookings, refreshKey]);

  const handleChat = (booking) => {
    onAction?.('chat', booking);
  };

  const handleAction = (type, item) => {
    setSelectedBooking(item);
    if (type === 'detail') setShowDetailModal(true);
    if (type === 'chat') handleChat(item);
    if (type === 'report') setShowReportModal(true);
    if (type === 'complain') {
      setShowDetailModal(false);
      setViewOnlyComplaint(null);
      setTimeout(() => setShowComplaintModal(true), 300);
    }
    if (type === 'viewComplaint') {
      setShowDetailModal(false);
      setViewOnlyComplaint(item); // In this case 'item' is the report object
      setTimeout(() => setShowComplaintModal(true), 300);
    }
    if (type === 'rate') {
      setShowReviewModal(true);
    }
    if (type === 'viewProject') {
      setShowDetailModal(false);
      onAction?.('viewProject', item);
    }
    if (type === 'rebook') onAction?.('rebook', item);
    if (type === 'pay') onAction?.('pay', item);
  };

  const filteredBookings = bookings.filter(b => {
    if (filterStatus === 'ApprovedAwaitingPayment') return b.status === 1 || b.status === 'ApprovedAwaitingPayment';
    if (filterStatus === 'Pending') return b.status === 0 || b.status === 'Pending';
    if (filterStatus === 'Confirmed') return b.status === 2 || b.status === 'Confirmed';
    if (filterStatus === 'Completed') return b.status === 3 || b.status === 'Completed';
    if (filterStatus === 'ComplaintPending') return b.status === 9 || b.status === 'ComplaintPending';
    if (filterStatus === 'Failed') return [4, 5, 6, 7, 8].includes(b.status) || ['Cancel', 'NoResponse', 'ConsultingReportOverdue'].includes(b.status);
    return true;
  }).sort((a, b) => new Date(b.startTime || 0) - new Date(a.startTime || 0));

  const renderBookingItem = ({ item }) => {
    const statusInfo = BOOKING_STATUS_LABELS[item.status] || { label: String(item.status), color: colors.primary };
    const startTime = new Date(item.startTime);
    const endTime = new Date(item.endTime);
    const isChatLoading = chatLoadingId === (item.id || item.bookingId);
    
    const isFree = item.isFreeRebookFromComplaint || item.IsFreeRebookFromComplaint || item.usedPremiumFreeQuota || item.UsedPremiumFreeQuota;

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
              <View style={{ flex: 1 }}>
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
            {isFree && (
              <View style={styles.metaItem}>
                <Sparkles size={14} color="#eab308" fill="#eab308" />
                <Text style={[styles.metaText, { color: '#eab308', fontWeight: '800' }]}>Miễn phí</Text>
              </View>
            )}
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
                style={[styles.actionBtn, styles.primaryBtn, { backgroundColor: colors.accentGreen }]}
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

            {(item.status === 3 || item.status === 'Completed') && (
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: colors.mutedBackground }]}
                onPress={() => handleAction('report', item)}
              >
                <FileText size={14} color={colors.text} />
                <Text style={[styles.actionBtnText, { color: colors.text }]}>Báo cáo</Text>
              </TouchableOpacity>
            )}

            {item.status === 9 && (
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: colors.primary + '15' }]}
                onPress={() => handleAction('detail', item)}
              >
                <Search size={14} color={colors.primary} />
                <Text style={[styles.actionBtnText, { color: colors.primary }]}>Khiếu nại</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>
      </FadeInView>
    );
  };

  const renderHeader = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsRow}>
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
          value={bookings.filter(b => [4, 5, 6, 7, 8].includes(b.status)).length} 
          color={colors.error} 
          colors={colors} 
          width={CARD_WIDTH} 
        />
      </View>
    </View>
  );

  const renderFilterBar = () => (
    <View style={[styles.filterContainer, { backgroundColor: colors.background, paddingVertical: 12, zIndex: 10 }]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={[styles.filterScroll, { paddingHorizontal: 0 }]}
        nestedScrollEnabled={true}
      >
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
  );

  const listData = [
    { id: 'STICKY_FILTER', type: 'filter' },
    ...(filteredBookings.length > 0 ? filteredBookings : [{ id: 'EMPTY_STATE', type: 'empty' }])
  ];

  const renderListItem = ({ item, index }) => {
    if (item.type === 'filter') return renderFilterBar();
    if (item.type === 'empty') {
      return (
        <View style={styles.emptyContainer}>
          <Search size={48} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            Không tìm thấy lịch tư vấn nào cho trạng thái này.
          </Text>
        </View>
      );
    }
    return renderBookingItem({ item });
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: colors.secondaryText }}>Đang tải lịch tư vấn...</Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item, index) => item.id || (item.bookingId ? item.bookingId.toString() : index.toString())}
          renderItem={renderListItem}
          ListHeaderComponent={renderHeader}
          stickyHeaderIndices={[1]}
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
          onClose={() => {
            setShowComplaintModal(false);
            setViewOnlyComplaint(null);
          }}
          bookingId={selectedBooking?.id || selectedBooking?.bookingId}
          targetUserId={selectedBooking?.advisorId}
          targetUserName={selectedBooking?.advisorName}
          viewOnlyReport={viewOnlyComplaint}
        />
      )}

      {showReviewModal && (
        <ReviewModal
          isVisible={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          booking={selectedBooking}
          onDone={() => {
            setShowReviewModal(false);
            loadBookings(true);
          }}
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
  filterContainer: { marginBottom: 16, zIndex: 10 },
  filterScroll: { gap: 8 },
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
  metaRow: { flexDirection: 'row', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
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
