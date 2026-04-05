import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Animated, RefreshControl, ActivityIndicator, Dimensions, Alert
} from 'react-native';
import { 
  TrendingUp, Users, Shield, Briefcase, Heart, 
  DollarSign, CheckCircle, MessageSquare, ChevronRight, PieChart, Star
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import * as Haptics from 'expo-haptics';
import Card from '../Card';
import FadeInView from '../FadeInView';

// Services
import investorService from '../../services/investorService';
import followerService from '../../services/followerService';
import connectionService from '../../services/connectionService';
import dealsService from '../../services/dealsService';
import signalRService from '../../services/signalRService';

// Child Components
import FollowedProjects from './FollowedProjects';
import SentConnectionRequests from './SentConnectionRequests';
import InvestmentDeals from './InvestmentDeals';
import ContractSigningModal from './ContractSigningModal';

const { width } = Dimensions.get('window');

const TABS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'investments', label: 'Đang đầu tư' },
  { id: 'sent_requests', label: 'Yêu cầu thông tin' },
  { id: 'followed', label: 'Đang theo dõi' },
  { id: 'preferences', label: 'Khẩu vị' },
];

export default function InvestorDashboard() {
  const { user } = useAuth();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Data States
  const [profile, setProfile] = useState(null);
  const [followingCount, setFollowingCount] = useState(0);
  const [requestsCount, setRequestsCount] = useState(0);
  const [deals, setDeals] = useState([]);
  const [stats, setStats] = useState({
    portfolioValue: 0,
    activeInvestments: 0,
    acceptedInterests: 0,
    successRate: 0
  });

  // UI States
  const [isLoadingDeals, setIsLoadingDeals] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);

  const pagerRef = useRef(null);
  const tabsScrollRef = useRef(null);

  const fetchData = async () => {
    if (!user?.userId) return;
    try {
      const [profileRes, followingRes, requestsRes, dealsRes] = await Promise.all([
        investorService.getMyProfile().catch(() => null),
        followerService.getMyFollowing().catch(() => null),
        connectionService.getMyConnectionRequests().catch(() => null),
        dealsService.getInvestorDeals().catch(() => null)
      ]);

      setProfile(profileRes);
      
      const followed = followingRes?.data?.items || followingRes?.data || [];
      setFollowingCount(followed.length);

      const requests = requestsRes?.data?.items || requestsRes?.data || [];
      setRequestsCount(requests.length);

      const activeDeals = dealsRes?.data?.items || dealsRes?.data || [];
      setDeals(activeDeals);

      // Simple Stat Calculation
      setStats({
        portfolioValue: activeDeals.reduce((acc, d) => acc + (d.amount || 0), 0),
        activeInvestments: activeDeals.length,
        acceptedInterests: requests.filter(r => r.status?.toLowerCase() === 'accepted').length,
        successRate: activeDeals.length > 0 ? 100 : 0 // Placeholder logic
      });

    } catch (err) {
      console.error('[InvestorDashboard] Fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // SignalR Listeners
    const handleNotification = (notif) => {
        if (notif.type === 'DealCreated' || notif.type === 'ConnectionAccepted') {
            fetchData();
        }
    };
    
    // signalRService.onNotificationReceived(handleNotification);
    // return () => signalRService.offNotificationReceived(handleNotification);
  }, [user]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleTabChange = (tabId) => {
    if (tabId !== activeTab) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tabId);
    const tabIndex = TABS.findIndex(t => t.id === tabId);
    if (tabIndex !== -1 && pagerRef.current) {
      pagerRef.current.scrollTo({ x: tabIndex * width, animated: true });
    }
    
    if (tabsScrollRef.current) {
      const tabWidth = width / 3.5;
      tabsScrollRef.current.scrollTo({ x: Math.max(0, tabIndex * tabWidth - width/3), animated: true });
    }
  };

  const handlePagerScroll = (event) => {
    const x = event.nativeEvent.contentOffset.x;
    const tabIndex = Math.round(x / width);
    if (TABS[tabIndex] && TABS[tabIndex].id !== activeTab) {
      setActiveTab(TABS[tabIndex].id);
      if (tabsScrollRef.current) {
        const tabWidth = width / 3.5;
        tabsScrollRef.current.scrollTo({ x: Math.max(0, tabIndex * tabWidth - width/3), animated: true });
      }
    }
  };

  const renderOverview = () => (
    <FadeInView style={styles.tabContent}>
      <View style={styles.metricsGrid}>
        <FadeInView delay={0}>
          <MetricCard 
            label="Giá trị danh mục" 
            value={`${stats.portfolioValue.toLocaleString()} VND`} 
            icon={<DollarSign size={20} color={colors.accentCyan} />}
            colors={colors}
          />
        </FadeInView>
        <FadeInView delay={100}>
          <MetricCard 
            label="Đang đầu tư" 
            value={stats.activeInvestments} 
            icon={<Briefcase size={20} color={colors.accentOrange} />}
            colors={colors}
          />
        </FadeInView>
        <FadeInView delay={200}>
          <MetricCard 
            label="Pitch đã chấp nhận" 
            value={stats.acceptedInterests} 
            icon={<CheckCircle size={20} color={colors.accentGreen} />}
            colors={colors}
          />
        </FadeInView>
        <FadeInView delay={300}>
          <MetricCard 
            label="Tỷ lệ thành công" 
            value={`${stats.successRate}%`} 
            icon={<TrendingUp size={20} color={colors.accentPurple} />}
            colors={colors}
          />
        </FadeInView>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Khẩu vị & Ưu tiên</Text>
      </View>

      <Card style={styles.infoCard}>
        <View style={styles.cardHeader}>
          <Star size={20} color={colors.accentOrange} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Khẩu vị đầu tư</Text>
        </View>
        <Text style={[styles.cardContent, { color: colors.secondaryText }]}>
          {profile?.investmentTaste || 'Chưa cập nhật khẩu vị đầu tư.'}
        </Text>
      </Card>

      <Card style={styles.infoCard}>
        <View style={styles.cardHeader}>
          <PieChart size={20} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Lĩnh vực quan tâm</Text>
        </View>
        <Text style={[styles.cardContent, { color: colors.secondaryText }]}>
          {profile?.focusArea || 'Chưa cập nhật lĩnh vực ưu tiên.'}
        </Text>
      </Card>
    </FadeInView>
  );

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
          {TABS.map((tab) => {
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
          <InvestmentDeals 
            deals={deals}
            isLoading={isLoadingDeals}
            onSign={(deal) => { setSelectedDeal(deal); setShowContractModal(true); }}
            onRefresh={fetchData}
            isInvestor={true}
          />
        </View>

        <View style={{ width }}>
          <SentConnectionRequests 
            onChat={(req) => { /* Navigate to chat */ }}
            onRefreshDashboard={fetchData}
          />
        </View>

        <View style={{ width }}>
          <FollowedProjects 
            onSelectProject={(p) => { /* Navigate to project detail */ }}
            onRefreshDashboard={fetchData}
          />
        </View>

        <View style={{ width }}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Card style={{ padding: 24, borderRadius: 28 }}>
                    <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 16 }]}>Tùy chỉnh khẩu vị</Text>
                    <Text style={[styles.cardContent, { color: colors.secondaryText }]}>
                        Chức năng chỉnh sửa khẩu vị trực tiếp đang được phát triển.
                    </Text>
                </Card>
            </ScrollView>
        </View>
      </ScrollView>

      <ContractSigningModal 
        visible={showContractModal}
        deal={selectedDeal}
        onClose={() => setShowContractModal(false)}
        onShowSuccess={(msg) => {
          Alert.alert('Thành công', msg);
          fetchData();
        }}
      />
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
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 24 },
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
