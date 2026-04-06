import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Animated, RefreshControl, ActivityIndicator, Dimensions, Alert 
} from 'react-native';
import { 
  Calendar, Star, Clock, MessageSquare, 
  CheckCircle, Briefcase, ChevronRight, Users, Bell, FileText
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import * as Haptics from 'expo-haptics';
import Card from '../Card';
import FadeInView from '../FadeInView';

// Services
import advisorService from '../../services/advisorService';
import advisorAvailabilityService from '../../services/advisorAvailabilityService';
import bookingService from '../../services/bookingService';
import signalRService from '../../services/signalRService';

// Child Components
import AdvisorAvailability from './AdvisorAvailability';
import AdvisorBookings from './AdvisorBookings';
import ConsultingReportModal from '../booking/ConsultingReportModal';
import BookingDetailModal from '../booking/BookingDetailModal';
import BookingChatModal from '../booking/BookingChatModal';
import chatService from '../../services/chatService';

const { width } = Dimensions.get('window');

const ADVISOR_TABS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'new_requests', label: 'Yêu cầu mới' },
  { id: 'schedule', label: 'Lịch tư vấn' },
  { id: 'calendar', label: 'Quản lý lịch rảnh' },
  { id: 'reports', label: 'Báo cáo' },
];

export default function AdvisorDashboard() {
  const { user } = useAuth();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Data States
  const [profile, setProfile] = useState(null);
  const [availabilities, setAvailabilities] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  // UI States
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeChatSession, setActiveChatSession] = useState(null);
  const [chatLoadingId, setChatLoadingId] = useState(null);

  const pagerRef = useRef(null);
  const tabsScrollRef = useRef(null);

  const fetchData = async () => {
    if (!user?.userId) return;
    try {
      const [profileRes, availRes, bookingsRes] = await Promise.all([
        advisorService.getMyProfile().catch(() => null),
        advisorAvailabilityService.getMyAvailabilities().catch(() => []),
        bookingService.getMyAdvisorBookings('', '-Id', 1, 100).catch(() => ({ items: [] }))
      ]);

      setProfile(profileRes);
      setAvailabilities(Array.isArray(availRes) ? availRes : (availRes?.items || []));
      setBookings(bookingsRes?.items || (Array.isArray(bookingsRes) ? bookingsRes : []));

    } catch (err) {
      console.error('[AdvisorDashboard] Fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // SignalR Listeners for Advisor
    // signalRService.onNotificationReceived((notif) => {
    //   if (notif.type === 'BookingCreated' || notif.type === 'BookingCancelled') {
    //     fetchData();
    //   }
    // });
  }, [user]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };
  
  const handleShowDetail = (booking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };
  
  const handleChat = async (booking) => {
    setChatLoadingId(booking.id || booking.bookingId);
    try {
      const result = await chatService.createOrGetBookingChat(booking.id || booking.bookingId);
      setSelectedBooking(booking);
      setActiveChatSession(result);
      setShowChatModal(true);
    } catch (error) {
      console.error('[AdvisorDashboard] Chat access failed:', error);
      Alert.alert('Lỗi', 'Không thể khởi tạo phòng chat.');
    } finally {
      setChatLoadingId(null);
    }
  };

  const handleTabChange = (tabId) => {
    if (tabId !== activeTab) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tabId);
    const tabIndex = ADVISOR_TABS.findIndex(t => t.id === tabId);
    if (tabIndex !== -1 && pagerRef.current) {
        pagerRef.current.scrollTo({ x: tabIndex * width, animated: true });
    }
    
    if (tabsScrollRef.current) {
        const tabWidth = width / 3;
        tabsScrollRef.current.scrollTo({ x: Math.max(0, tabIndex * tabWidth - width/3), animated: true });
    }
  };

  const handlePagerScroll = (event) => {
    const x = event.nativeEvent.contentOffset.x;
    const tabIndex = Math.round(x / width);
    if (ADVISOR_TABS[tabIndex] && ADVISOR_TABS[tabIndex].id !== activeTab) {
        setActiveTab(ADVISOR_TABS[tabIndex].id);
        if (tabsScrollRef.current) {
            const tabWidth = width / 3;
            tabsScrollRef.current.scrollTo({ x: Math.max(0, tabIndex * tabWidth - width/3), animated: true });
        }
    }
  };

  const renderOverview = () => {
    const pendingCount = bookings.filter(b => b.status === 0 || b.status === 'Pending').length;
    const upcomingCount = bookings.filter(b => b.status === 2 || b.status === 'Confirmed').length;
    const freeSlots = availabilities.filter(a => a.status === 0 || a.status === 'Available').length;

    return (
      <View style={styles.tabContent}>
        <View style={styles.statsGrid}>
          <FadeInView delay={0}>
            <MetricCard 
              label="Yêu cầu chờ" 
              value={pendingCount} 
              icon={<Bell size={20} color={colors.accentOrange} />}
              colors={colors}
              color={colors.accentOrange}
              onPress={() => handleTabChange('new_requests')}
            />
          </FadeInView>
          <FadeInView delay={100}>
            <MetricCard 
              label="Lịch sắp tới" 
              value={upcomingCount} 
              icon={<Calendar size={20} color={colors.primary} />}
              colors={colors}
              color={colors.primary}
              onPress={() => handleTabChange('schedule')}
            />
          </FadeInView>
          <FadeInView delay={200}>
            <MetricCard 
              label="Slot còn trống" 
              value={freeSlots} 
              icon={<Clock size={20} color={colors.accentCyan} />}
              colors={colors}
              color={colors.accentCyan}
              onPress={() => handleTabChange('calendar')}
            />
          </FadeInView>
          <FadeInView delay={300}>
            <MetricCard 
              label="Đánh giá" 
              value={profile?.rating?.toFixed(1) || '5.0'} 
              icon={<Star size={20} color={colors.accentYellow} />}
              colors={colors}
              color={colors.accentYellow}
            />
          </FadeInView>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Thông tin chuyên gia</Text>
        </View>

        <Card style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Briefcase size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Lĩnh vực chuyên môn</Text>
          </View>
          <Text style={[styles.cardContent, { color: colors.secondaryText }]}>
            {profile?.expertise || profile?.bio || 'Chưa cập nhật thông tin chuyên môn.'}
          </Text>
        </Card>

        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Lời nhắn gần đây</Text>
        </View>
        <Card style={[styles.infoCard, { alignItems: 'center', paddingVertical: 40 }]}>
            <MessageSquare size={32} color={colors.border} />
            <Text style={{ color: colors.secondaryText, marginTop: 12, fontWeight: '600' }}>Không có tin nhắn mới.</Text>
        </Card>
      </View>
    );
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <ScrollView 
          ref={tabsScrollRef}
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContainer}
        >
          {ADVISOR_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => handleTabChange(tab.id)}
                style={[styles.tabItem, isActive && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}
              >
                <Text style={[styles.tabLabel, { color: isActive ? colors.primary : colors.secondaryText }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView 
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handlePagerScroll}
        bounces={false}
        scrollEventThrottle={16}
      >
        <View style={{ width }}>
          <ScrollView refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
            {renderOverview()}
          </ScrollView>
        </View>

        <View style={{ width }}>
          <AdvisorBookings 
            activeTab="pending"
            onShowDetail={handleShowDetail}
            onRefresh={fetchData}
          />
        </View>

        <View style={{ width }}>
          <AdvisorBookings 
            activeTab="confirmed"
            onChat={handleChat}
            onShowReport={(b) => { setSelectedBooking(b); setShowReportModal(true); }}
            onShowDetail={handleShowDetail}
            onRefresh={fetchData}
          />
        </View>

        <View style={{ width }}>
          <AdvisorAvailability />
        </View>

        <View style={{ width }}>
          <AdvisorBookings 
            activeTab="completed"
            onShowReport={(b) => { setSelectedBooking(b); setShowReportModal(true); }}
            onShowDetail={handleShowDetail}
            onRefresh={fetchData}
          />
        </View>
      </ScrollView>

      {showReportModal && (
        <ConsultingReportModal 
          isVisible={showReportModal}
          bookingId={selectedBooking?.id || selectedBooking?.bookingId}
          userRole="Advisor"
          onClose={() => {
            setShowReportModal(false);
            setSelectedBooking(null);
          }}
          onShowSuccess={(msg) => {
            Alert.alert('Thành công', msg);
            fetchData();
          }}
        />
      )}

      {showDetailModal && (
        <BookingDetailModal
          isVisible={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          booking={selectedBooking}
          userRole="Advisor"
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
    </View>
  );
}

function MetricCard({ label, value, icon, colors, color, onPress }) {
  return (
    <TouchableOpacity 
        style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => {
          if (onPress) {
            Haptics.selectionAsync();
            onPress();
          }
        }}
        disabled={!onPress}
    >
      <View style={styles.metricHeader}>
        <View style={[styles.iconBox, { backgroundColor: (color || colors.primary) + '15' }]}>
            {icon}
        </View>
        <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>{label}</Text>
      </View>
      <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabBar: { borderBottomWidth: 1 },
  tabScrollContainer: { paddingHorizontal: 10 },
  tabItem: { paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 13, fontWeight: '800' },
  tabContent: { padding: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 24 },
  metricCard: { width: (width - 52) / 2, padding: 18, borderRadius: 24, borderWidth: 1 },
  metricHeader: { marginBottom: 16 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  metricLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  metricValue: { fontSize: 22, fontWeight: '900' },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '900' },
  infoCard: { padding: 20, marginBottom: 16, borderRadius: 24 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  cardContent: { fontSize: 14, lineHeight: 22, fontWeight: '500' }
});
