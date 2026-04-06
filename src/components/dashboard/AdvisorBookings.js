import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Alert, Dimensions, ScrollView 
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { 
  Users, Calendar, Clock, MessageSquare, 
  FileText, Check, X, Eye, ChevronRight, Info
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import Card from '../Card';
import FadeInView from '../FadeInView';
import bookingService from '../../services/bookingService';

const { width } = Dimensions.get('window');

const BOOKING_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: 'Chờ duyệt' },
  { id: 'confirmed', label: 'Sắp tới' },
  { id: 'completed', label: 'Hoàn thành' },
  { id: 'cancelled', label: 'Đã hủy' },
];

export default function AdvisorBookings({ 
  onChat, 
  onShowReport, 
  onShowDetail,
  activeTab: externalTab = 'all'
}) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState(externalTab);
  const [actionLoading, setActionLoading] = useState({});

  const fetchBookings = useCallback(async () => {
    try {
      const data = await bookingService.getMyAdvisorBookings('', '-Id', 1, 100);
      const items = data?.items || (Array.isArray(data) ? data : []);
      setBookings(items);
    } catch (error) {
      console.error('[AdvisorBookings] fetch error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    if (externalTab) setActiveTab(externalTab);
  }, [externalTab]);

  const handleApprove = async (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActionLoading(prev => ({ ...prev, [id]: 'approve' }));
    try {
      await bookingService.approveBooking(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fetchBookings();
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể duyệt yêu cầu này.');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleReject = async (id) => {
    Alert.alert(
      'Xác nhận từ chối',
      'Bạn có chắc chắn muốn từ chối yêu cầu tư vấn này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Từ chối', 
          style: 'destructive',
          onPress: async () => {
            setActionLoading(prev => ({ ...prev, [id]: 'reject' }));
            try {
              await bookingService.rejectBooking(id);
              fetchBookings();
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể từ chối yêu cầu này.');
            } finally {
              setActionLoading(prev => ({ ...prev, [id]: null }));
            }
          }
        }
      ]
    );
  };

  const getStatusInfo = (status) => {
    // 0=Pending, 1=ApprovedAwaitingPayment, 2=Confirmed, 3=Completed, 4=Cancel, 5=NoResponse
    switch (status) {
      case 0:
      case 'Pending':
        return { label: 'Chờ duyệt', color: colors.statusPendingText, bg: colors.statusPendingBg, cat: 'pending' };
      case 1:
      case 'ApprovedAwaitingPayment':
        return { label: 'Chờ thanh toán', color: colors.statusPendingText, bg: colors.statusPendingBg, cat: 'pending' };
      case 2:
      case 'Confirmed':
        return { label: 'Đã xác nhận', color: colors.primary, bg: colors.primary + '15', cat: 'confirmed' };
      case 3:
      case 'Completed':
        return { label: 'Hoàn thành', color: colors.statusApprovedText, bg: colors.statusApprovedBg, cat: 'completed' };
      default:
        return { label: 'Đã hủy', color: colors.statusRejectedText, bg: colors.statusRejectedBg, cat: 'cancelled' };
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'all') return true;
    const info = getStatusInfo(b.status);
    return info.cat === activeTab;
  });

  const renderItem = ({ item, index }) => {
    const info = getStatusInfo(item.status);
    const isPending = item.status === 0 || item.status === 'Pending';
    const isConfirmed = item.status === 2 || item.status === 'Confirmed';
    const isActioning = actionLoading[item.id];

    return (
      <FadeInView delay={index * 50}>
        <Card style={[styles.bookingCard, { borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.statusBadge, { backgroundColor: info.bg }]}>
              <Text style={[styles.statusText, { color: info.color }]}>{info.label}</Text>
            </View>
            <Text style={[styles.bookingId, { color: colors.secondaryText }]}>#{item.id}</Text>
          </View>

          <Text style={[styles.projectName, { color: colors.text }]} numberOfLines={1}>
            {item.projectName || 'Dự án tư vấn'}
          </Text>
          <View style={styles.customerRow}>
            <Users size={14} color={colors.secondaryText} />
            <Text style={[styles.customerName, { color: colors.secondaryText }]}>
              Startup: <Text style={{ color: colors.text, fontWeight: '700' }}>{item.customerName}</Text>
            </Text>
          </View>

          <View style={[styles.dateTimeRow, { backgroundColor: colors.mutedBackground }]}>
            <View style={styles.timeInfo}>
              <Calendar size={14} color={colors.primary} />
              <Text style={[styles.dateText, { color: colors.text }]}>
                {new Date(item.startTime).toLocaleDateString('vi-VN')}
              </Text>
            </View>
            <View style={styles.timeInfo}>
              <Clock size={14} color={colors.primary} />
              <Text style={[styles.dateText, { color: colors.text }]}>
                {new Date(item.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.actions}>
            {isPending ? (
              <>
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: colors.statusApprovedBg }]}
                  onPress={() => handleApprove(item.id)}
                  disabled={!!isActioning}
                >
                  {isActioning === 'approve' ? <ActivityIndicator size="small" color={colors.statusApprovedText} /> : <Check size={18} color={colors.statusApprovedText} />}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: colors.statusRejectedBg }]}
                  onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      handleReject(item.id);
                  }}
                  disabled={!!isActioning}
                >
                  <X size={18} color={colors.statusRejectedText} />
                </TouchableOpacity>
              </>
            ) : isConfirmed ? (
              <>
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                      Haptics.selectionAsync();
                      onChat?.(item);
                  }}
                >
                  <MessageSquare size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: colors.accentCyan }]}
                  onPress={() => {
                      Haptics.selectionAsync();
                      onShowReport?.(item);
                  }}
                >
                  <FileText size={18} color="#fff" />
                </TouchableOpacity>
              </>
            ) : null}
            
            <TouchableOpacity 
              style={[styles.detailBtn, { borderLeftWidth: (isPending || isConfirmed) ? 1 : 0, borderLeftColor: colors.border }]}
              onPress={() => onShowDetail?.(item)}
            >
              <Text style={[styles.detailBtnText, { color: colors.secondaryText }]}>Chi tiết</Text>
              <ChevronRight size={16} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>
        </Card>
      </FadeInView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {BOOKING_TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity 
                key={tab.id} 
                onPress={() => {
                    if (activeTab !== tab.id) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setActiveTab(tab.id);
                    }
                }}
                style={[styles.tabItem, isActive && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              >
                <Text style={[styles.tabLabel, { color: isActive ? colors.primary : colors.secondaryText }]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredBookings}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listPadding}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); fetchBookings(); }} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Info size={48} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>Không tìm thấy yêu cầu tư vấn nào.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: { borderBottomWidth: 1 },
  tabScroll: { paddingHorizontal: 16 },
  tabItem: { paddingVertical: 14, paddingHorizontal: 16 },
  tabLabel: { fontSize: 13, fontWeight: '800' },
  listPadding: { padding: 20 },
  bookingCard: { padding: 18, marginBottom: 16, borderRadius: 24, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '800' },
  bookingId: { fontSize: 11, fontWeight: '600', fontFamily: 'monospace' },
  projectName: { fontSize: 18, fontWeight: '900', marginBottom: 6 },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  customerName: { fontSize: 13, fontWeight: '500' },
  dateTimeRow: { flexDirection: 'row', padding: 12, borderRadius: 14, gap: 20, marginBottom: 16 },
  timeInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 13, fontWeight: '700' },
  divider: { height: 1, width: '100%', marginBottom: 16, opacity: 0.3 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  detailBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, height: 44, paddingLeft: 12 },
  detailBtnText: { fontSize: 13, fontWeight: '700' },
  emptyContainer: { paddingVertical: 100, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyText: { fontSize: 15, fontWeight: '700' }
});
