import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, RefreshControl, ActivityIndicator, Dimensions, Modal, Alert
} from 'react-native';
import { useScrollToTop, useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import {
  TrendingUp, Users, FileText, CheckCircle,
  Eye, Plus, ChevronRight, Target, MessageSquare, Briefcase, Calendar, Crown
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSubscription } from '../../context/SubscriptionContext';
import * as Haptics from 'expo-haptics';
import Card from '../Card';
import FadeInView from '../FadeInView';

// Services
import startupProfileService from '../../services/startupProfileService';
import projectSubmissionService from '../../services/projectSubmissionService';
import advisorService from '../../services/advisorService';
import connectionService from '../../services/connectionService';
import dealsService from '../../services/dealsService';
import signalRService from '../../services/signalRService';
import chatService from '../../services/chatService';

// Child Components
import StartupProfileForm from './StartupProfileForm';
import DashboardProjectDetail from './DashboardProjectDetail';
import AIScoreCard from './AIScoreCard';
import InvestorConnectionRequests from './InvestorConnectionRequests';
import InvestmentDeals from './InvestmentDeals';
import StartupBookings from './StartupBookings';
import ContractSigningModal from './ContractSigningModal';
import ProjectSubmissionForm from '../startup/ProjectSubmissionForm';
import PaymentModal from '../PaymentModal';
import AdvisorBookingModal from '../AdvisorBookingModal';
import QuotaGuardModal from '../common/QuotaGuardModal';
import { Brain, Sparkles, ShieldCheck } from 'lucide-react-native';
import OnchainResultModal from './OnchainResultModal';
import BookingChatModal from '../booking/BookingChatModal';
import InvestmentDealDetailModal from './InvestmentDealDetailModal';
const { width } = Dimensions.get('window');

const TABS = [
  { id: 'projects', label: 'Dự án' },
  { id: 'connections', label: 'Kết nối' },
  { id: 'bookings', label: 'Cố vấn' },
  { id: 'deals', label: 'Đầu tư' },
  { id: 'profile', label: 'Hồ sơ' },
];

export default function StartupDashboard({ initialTab }) {
  const { user } = useAuth();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  const router = useRouter();
  const { quota, isPremium, isLoading: subLoading } = useSubscription();

  const [activeTab, setActiveTab] = useState('projects');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data States
  const [startupProfile, setStartupProfile] = useState(null);
  const [myProjects, setMyProjects] = useState([]);
  const [advisorRequests, setAdvisorRequests] = useState([]);
  const [investorRequests, setInvestorRequests] = useState([]);
  const [investmentDeals, setInvestmentDeals] = useState([]);
  const [stats, setStats] = useState({
    profileViews: 0,
    investorInterests: 0,
    documentsUploaded: 0,
    aiScore: 0,
    completion: 0
  });

  // UI States
  const [showProjectWizard, setShowProjectWizard] = useState(false);
  const [showProjectDetail, setShowProjectDetail] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [isEvaluatingAI, setIsEvaluatingAI] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isLoadingDeals, setIsLoadingDeals] = useState(false);
  const [isRespondingDealId, setIsRespondingDealId] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);
  const [bookingsRefreshKey, setBookingsRefreshKey] = useState(0);
  const [isFetchingProject, setIsFetchingProject] = useState(false);

  // Modal States
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showAIQuotaModal, setShowAIQuotaModal] = useState(false);
  const [projectForAI, setProjectForAI] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [sourceBookingIdForRebook, setSourceBookingIdForRebook] = useState(null);
  const [showOnchainModal, setShowOnchainModal] = useState(false);
  const [onchainData, setOnchainData] = useState(null);
  const [showDealDetailModal, setShowDealDetailModal] = useState(false);
  
  // Shared Chat Modal State
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeChatSession, setActiveChatSession] = useState(null);
  const [chatLoadingId, setChatLoadingId] = useState(null);
  const currentTabIndexRef = useRef(0);
  const isManualScrolling = useRef(false);

  const scrollX = useRef(new Animated.Value(0)).current;
  const pagerRef = useRef(null);
  const tabsScrollRef = useRef(null);
  const mainScrollRef = useRef(null);
  useScrollToTop(mainScrollRef);

  useFocusEffect(
    React.useCallback(() => {
      if (mainScrollRef.current) {
        mainScrollRef.current.scrollTo({ y: 0, animated: false });
      }
    }, [])
  );

  // SignalR Initialization & Tab Deep Linking
  useEffect(() => {
    if (initialTab && TABS.some(t => t.id === initialTab)) {
      setActiveTab(initialTab);
      const tabIndex = TABS.findIndex(t => t.id === initialTab);
      if (tabIndex !== -1 && pagerRef.current) {
        // Wait a bit for layout
        setTimeout(() => {
          pagerRef.current.scrollTo({ x: tabIndex * width, animated: true });
        }, 300);
      }
    }
  }, [initialTab]);

  useEffect(() => {
    // Listen for real-time notifications to refresh data
    const unsubscribe = signalRService.onNotificationReceived((notification) => {
      console.log('[StartupDashboard] Real-time notification received, refreshing data:', notification);
      
      const type = (notification.referenceType || notification.ReferenceType || '').toLowerCase();
      const message = notification.message || notification.Message || '';

      // Auto-fetch data if relevant
      if (type === 'connectionrequest' || type === 'connection') {
        fetchInvestorRequests();
      } else if (type === 'deal' || type === 'investment') {
        fetchInvestmentDeals();
      } else if (type === 'booking' || type === 'consultingreport') {
        setBookingsRefreshKey(prev => prev + 1);
      } else {
        fetchData();
      }

      // Show toast-like alert for important events
      if (message) {
        // We could use a custom toast here, but for now just console
        console.log('[Notification]', message);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const fetchData = async () => {
    if (!user?.userId) return;

    try {
      const [profileRes, projectsRes] = await Promise.all([
        startupProfileService.getStartupProfileByUserId(user.userId),
        projectSubmissionService.getMyProjects()
      ]);

      setStartupProfile(profileRes);
      const projects = Array.isArray(projectsRes?.data) ? projectsRes.data : (projectsRes?.data?.items || []);
      setMyProjects(projects);
      setAdvisorRequests([]); // Advisors are currently handled via bookings

      // Extended data (connections & deals)
      if (activeTab === 'connections') fetchInvestorRequests();
      if (activeTab === 'deals') fetchInvestmentDeals();

      // Stats calculation
      let compl = 20;
      if (profileRes) {
        if (profileRes.logoUrl) compl += 10;
        if (profileRes.companyName) compl += 10;
        if (profileRes.founder) compl += 20;
        if (profileRes.contactInfo) compl += 10;
        if (profileRes.countryCity) compl += 10;
        if (profileRes.website) compl += 10;
        if (profileRes.industry) compl += 10;
      }

      // Sync stats (if needed for summary numbers on tabs)
      setStats({
        profileViews: profileRes?.followers?.length || 0,
        investorInterests: 0,
        documentsUploaded: 0,
        aiScore: profileRes?.projects?.[0]?.aiEvaluation?.startupScore || projects[0]?.aiEvaluation?.startupScore || 0,
        completion: compl
      });

    } catch (err) {
      console.error('Dashboard data fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchInvestorRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const response = await connectionService.getReceivedConnectionRequests();
      const items = response?.data?.items || response?.data || [];

      const formatted = items.map(req => ({
        connectionRequestId: req.connectionRequestId || req.id,
        investorId: req.investorId || req.investor?.userId || req.investor?.id || req.senderId,
        investorName: req.investorName || req.investor?.fullName || 'Nhà đầu tư',
        status: (req.status || 'pending').toLowerCase(),
        message: req.message || '',
        sentDate: req.responseDate || req.createdAt ? new Date(req.responseDate || req.createdAt).toLocaleString('vi-VN') : 'Mới đây',
        chatSessionId: req.chatSessionId || req.chatSession?.id
      }));
      setInvestorRequests(formatted);
      setStats(prev => ({ ...prev, investorInterests: formatted.length }));
    } catch (error) {
      console.error('[StartupDashboard] fetchInvestorRequests error:', error);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const fetchInvestmentDeals = async () => {
    setIsLoadingDeals(true);
    try {
      const response = await dealsService.getStartupDeals();
      const items = Array.isArray(response?.data) ? response.data : (response?.data?.items || []);
      const formatted = items.map(deal => ({
        dealId: deal.dealId || deal.id,
        projectId: deal.projectId,
        projectName: deal.projectName || deal.project?.projectName || 'Dự án',
        investorId: deal.investorId,
        investorName: deal.investorName || deal.investor?.fullName || 'Nhà đầu tư',
        amount: deal.amount || deal.investAmount || 0,
        equityOffer: deal.equityOffer || deal.equityPercentage || 0,
        status: deal.status, // Keep raw status (number or string)
        statusStr: (deal.statusStr || deal.status?.toString() || 'Pending').toUpperCase(),
        createdAt: deal.createdAt || deal.createdDate || new Date().toISOString(),
        contractUrl: deal.contractUrl,
      }));
      setInvestmentDeals(formatted);
    } catch (error) {
      console.error('[StartupDashboard] fetchInvestmentDeals error:', error);
    } finally {
      setIsLoadingDeals(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'connections') fetchInvestorRequests();
    if (activeTab === 'deals') fetchInvestmentDeals();
  }, [activeTab]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };
  const handleTabChange = (tabId) => {
    const tabIndex = TABS.findIndex(t => t.id === tabId);
    if (tabIndex === -1 || tabIndex === currentTabIndexRef.current) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // 1. Update refs and lock immediately to prevent scroll listener interference
    currentTabIndexRef.current = tabIndex;
    isManualScrolling.current = true;
    
    // 2. Update state to change content
    setActiveTab(tabId);
    
    // 3. Trigger scroll
    if (pagerRef.current) {
      pagerRef.current.scrollTo({ x: tabIndex * width, animated: true });
      
      // 4. Sync the tabs scroll bar
      if (tabsScrollRef.current) {
        const tabWidth = 100;
        tabsScrollRef.current.scrollTo({ x: Math.max(0, tabIndex * tabWidth - width / 3), animated: true });
      }

      // 5. Release lock after animation is definitely finished
      setTimeout(() => {
        isManualScrolling.current = false;
      }, 600);
    }
  };

  const handlePagerScroll = (event) => {
    // If we are moving due to a tab click, ignore all scroll events
    if (isManualScrolling.current) return;
    
    const x = event.nativeEvent.contentOffset.x;
    
    // Only trigger state change if we are very close to a page center
    // This avoids flickering during the swipe
    const tabIndex = Math.round(x / width);
    const distanceToCenter = Math.abs(x - tabIndex * width);
    
    if (distanceToCenter < 10 && tabIndex !== currentTabIndexRef.current && TABS[tabIndex]) {
      currentTabIndexRef.current = tabIndex;
      setActiveTab(TABS[tabIndex].id);
      
      if (tabsScrollRef.current) {
        const tabWidth = 100;
        tabsScrollRef.current.scrollTo({ x: Math.max(0, tabIndex * tabWidth - width / 3), animated: true });
      }
    }
  };

  const checkApproved = (actionName) => {
    if (startupProfile?.status !== 'Approved' && startupProfile?.status !== 'Active') {
      Alert.alert(
        'Yêu cầu phê duyệt',
        `Bạn cần được đội ngũ AISEP phê duyệt hồ sơ Startup để thực hiện hành động: ${actionName}.`
      );
      return false;
    }
    return true;
  };

  const handleApproveConnection = async (id) => {
    if (!checkApproved('chấp nhận kết nối')) return;
    try {
      const res = await connectionService.respondToConnection(id, true);
      if (res) {
        Alert.alert('Thành công', 'Đã chấp nhận yêu cầu kết nối. Bạn có thể bắt đầu trò chuyện với nhà đầu tư.');
        fetchInvestorRequests();
      }
    } catch (err) { Alert.alert('Lỗi', 'Không thể xử lý yêu cầu.'); }
  };

  const handleRejectConnection = async (id) => {
    if (!checkApproved('từ chối kết nối')) return;
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn từ chối yêu cầu kết nối này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Từ chối', 
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await connectionService.respondToConnection(id, false);
              if (res) {
                fetchInvestorRequests();
              }
            } catch (err) { Alert.alert('Lỗi', 'Không thể xử lý yêu cầu.'); }
          }
        }
      ]
    );
  };

  const handleChat = async (item, type = 'booking') => {
    const itemId = item.id || item.bookingId || item.connectionRequestId;
    setChatLoadingId(itemId);
    try {
      if (type === 'connection') {
        setSelectedConnection(item);
        setSelectedBooking(null);
        setActiveChatSession({ chatSessionId: item.chatSessionId });
      } else {
        const result = await chatService.createOrGetBookingChat(itemId);
        setSelectedBooking(item);
        setSelectedConnection(null);
        setActiveChatSession(result);
      }
      setShowChatModal(true);
    } catch (error) {
      console.error('[StartupDashboard] Chat access failed:', error);
      Alert.alert('Lỗi', 'Không thể khởi tạo phòng chat.');
    } finally {
      setChatLoadingId(null);
    }
  };

  const handleApproveDeal = async (id) => {
    if (!checkApproved('chấp nhận đầu tư')) return;
    setIsRespondingDealId(id);
    try {
      const res = await dealsService.respondToDeal(id, true);
      if (res?.success || res?.data) {
        Alert.alert('Thành công', 'Đã chấp nhận đầu tư! Vui lòng tiến hành ký hợp đồng.');
        fetchInvestmentDeals();
      }
    } catch (err) { Alert.alert('Lỗi', 'Không thể xử lý đầu tư.'); }
    finally { setIsRespondingDealId(null); }
  };

  const handleRejectDeal = async (id) => {
    if (!checkApproved('từ chối đầu tư')) return;
    
    // For simplicity in mobile, we ask for confirmation. 
    // In a full implementation, we'd show a modal for the reason.
    Alert.alert(
      'Từ chối đầu tư',
      'Bạn có chắc chắn muốn từ chối lời đề nghị đầu tư này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận từ chối',
          style: 'destructive',
          onPress: async () => {
            setIsRespondingDealId(id);
            try {
              const res = await dealsService.respondToDeal(id, false);
              if (res?.success || res?.data) {
                Alert.alert('Thông báo', 'Đã từ chối đề nghị đầu tư.');
                fetchInvestmentDeals();
              }
            } catch (err) { Alert.alert('Lỗi', 'Không thể xử lý.'); }
            finally { setIsRespondingDealId(null); }
          }
        }
      ]
    );
  };

  const handleViewInvestorProfile = (investorId) => {
    if (investorId) {
      router.push(`/investor/${investorId}`);
    } else {
      Alert.alert('Thông báo', 'Không tìm thấy thông tin nhà đầu tư.');
    }
  };

  const handleVerifyDealOnchain = async (dealId) => {
    try {
      setIsRefreshing(true);
      const response = await dealsService.verifyDealOnchain(dealId);
      const normalized = dealsService.normalizeDealOnchainResult(response);
      const explorerLink = dealsService.getDealOnchainExplorerLink(normalized);
      
      setOnchainData({ ...normalized, explorerLink });
      setShowOnchainModal(true);
    } catch (error) {
      console.error('[StartupDashboard] Onchain verify error:', error);
      Alert.alert('Lỗi', 'Không thể truy xuất dữ liệu blockchain.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAIEvaluation = async (project) => {
    if (!isPremium) {
      Alert.alert(
        'Tính năng Premium',
        'Bạn cần nâng cấp gói dịch vụ để thực hiện phân tích AI cho dự án này.',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Nâng cấp ngay', onPress: () => router.push('/subscription/management') }
        ]
      );
      return;
    }
    setProjectForAI(project);
    setShowAIQuotaModal(true);
  };

  const handleConfirmAIAnalysis = async () => {
    if (!projectForAI) return;
    setShowAIQuotaModal(false);
    setIsEvaluatingAI(true);
    try {
      const res = await projectSubmissionService.triggerAIAnalysis(projectForAI.id || projectForAI.projectId);
      if (res?.success || res?.isSuccess) {
        Alert.alert('Thành công', 'Đang tiến hành đánh giá AI. Kết quả sẽ được cập nhật sau vài giây.');
        refreshSubscription();
        fetchData();
      } else {
        Alert.alert('Lỗi', res?.message || 'Không thể kích hoạt đánh giá AI');
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Lỗi kết nối máy chủ');
    } finally {
      setIsEvaluatingAI(false);
      setProjectForAI(null);
    }
  };



  const renderProjects = () => (
    <View style={styles.tabContent}>
      {myProjects.length === 0 ? (
        <View style={styles.emptyState}>
          <FileText size={48} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>Bạn chưa có dự án nào.</Text>
        </View>
      ) : (
        myProjects.map((project, idx) => (
          <FadeInView key={project.id || idx} delay={idx * 100}>
            <ProjectListItem
              project={project}
              colors={colors}
              isDark={activeTheme.isDark}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedProject(project);
                setShowProjectDetail(true);
              }}
            />
          </FadeInView>
        ))
      )}
    </View>
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

      {/* Scrollable Tab Switcher */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <ScrollView
          ref={tabsScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContainer}
        >
          {TABS.map((tab, index) => {
            // Calculate opacity for active state based on scrollX
            const opacity = scrollX.interpolate({
              inputRange: [
                (index - 1) * width,
                index * width,
                (index + 1) * width
              ],
              outputRange: [0, 1, 0],
              extrapolate: 'clamp'
            });

            // Get count for the tab
            let count = 0;
            if (tab.id === 'connections') count = investorRequests.filter(r => r.status === 'pending').length;
            if (tab.id === 'deals') count = investmentDeals.filter(d => d.status === 'Pending' || d.status === 0).length;
            
            const labelWithCount = count > 0 ? `${tab.label} (${count})` : tab.label;

            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => handleTabChange(tab.id)}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                <View style={styles.labelContainer}>
                  {/* Inactive Label */}
                  <Text style={[styles.tabLabel, { color: colors.secondaryText }]}>
                    {labelWithCount}
                  </Text>
                  {/* Active Label (Fades in/out based on scroll) */}
                  <Animated.Text style={[
                    styles.tabLabel, 
                    { 
                      color: colors.primary, 
                      position: 'absolute',
                      opacity 
                    }
                  ]}>
                    {labelWithCount}
                  </Animated.Text>
                </View>
              </TouchableOpacity>
            );
          })}
          
          {/* Animated Pill */}
          <Animated.View 
            style={[
              styles.tabPill, 
              { 
                backgroundColor: colors.primary,
                width: 40, // Fixed width for the pill
                transform: [{
                  translateX: scrollX.interpolate({
                    inputRange: TABS.map((_, i) => i * width),
                    outputRange: TABS.map((_, i) => i * 100 + 30), // 30 (to center 40px pill in 100px tab)
                    extrapolate: 'clamp'
                  })
                }]
              }
            ]} 
          />
        </ScrollView>
      </View>

      <Animated.ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { 
            useNativeDriver: true,
            listener: handlePagerScroll 
          }
        )}
        scrollEventThrottle={16}
      >
        <View style={{ width }}>
          <ScrollView
            ref={mainScrollRef}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          >
            {renderProjects()}
          </ScrollView>
        </View>

        {/* Projects Tab content already handled in first view of pager */}


        <View style={{ width }}>
          <View style={{ flex: 1, paddingHorizontal: 0, paddingTop: 20 }}>
            <InvestorConnectionRequests
              requests={investorRequests}
              isLoading={isLoadingRequests}
              onApprove={handleApproveConnection}
              onReject={handleRejectConnection}
              onChat={(req) => handleChat(req, 'connection')}
              onViewProfile={handleViewInvestorProfile}
              onRefresh={fetchInvestorRequests}
            />
          </View>
        </View>

        <View style={{ width }}>
          <StartupBookings
            refreshKey={bookingsRefreshKey}
            onAction={(action, item) => {
              if (action === 'chat') handleChat(item, 'booking');
              if (action === 'pay') {
                setSelectedBookingForPayment(item);
                setShowPaymentModal(true);
              }
              if (action === 'viewProject') {
                const projectId = item.projectId || item.ProjectId;
                const proj = myProjects.find(p => (p.id || p.projectId) === projectId);
                
                if (proj) {
                  setSelectedProject(proj);
                  setShowProjectDetail(true);
                } else if (projectId) {
                  // Fallback: Fetch from API
                  setIsFetchingProject(true);
                  projectSubmissionService.getProjectById(projectId)
                    .then(res => {
                      if (res?.data) {
                        setSelectedProject(res.data);
                        setShowProjectDetail(true);
                      } else {
                        Alert.alert('Thông báo', 'Không tìm thấy thông tin dự án này.');
                      }
                    })
                    .catch(() => Alert.alert('Lỗi', 'Không thể tải thông tin dự án.'))
                    .finally(() => setIsFetchingProject(false));
                } else {
                  Alert.alert('Thông báo', 'Thông tin dự án không tồn tại.');
                }
              }
              if (action === 'rebook') {
                setSourceBookingIdForRebook(item.id || item.bookingId);
                setShowBookingModal(true);
              }
            }}
          />
        </View>

        <View style={{ width }}>
          <InvestmentDeals
            deals={investmentDeals}
            isLoading={isLoadingDeals}
            onApprove={(id) => {
              const d = investmentDeals.find(x => x.dealId === id);
              setSelectedDeal(d);
              setShowDealDetailModal(true);
            }}
            onReject={(id) => {
              const d = investmentDeals.find(x => x.dealId === id);
              setSelectedDeal(d);
              setShowDealDetailModal(true);
            }}
            onSign={(deal) => { 
              setSelectedDeal(deal); 
              setShowContractModal(true); 
            }}
            onVerifyOnchain={handleVerifyDealOnchain}
            onViewProfile={handleViewInvestorProfile}
            onRefresh={fetchInvestmentDeals}
            isRespondingId={isRespondingDealId}
          />
        </View>

        <View style={{ width }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Subscription Quota Card */}
            <StartupProfileForm
              initialData={startupProfile}
              user={user}
              onSuccess={(data) => { setStartupProfile(data); fetchData(); }}
            />
          </ScrollView>
        </View>
      </Animated.ScrollView>

      <ProjectSubmissionForm
        visible={showProjectWizard}
        initialData={editingProject}
        onClose={() => {
          setShowProjectWizard(false);
          setEditingProject(null);
        }}
        onSuccess={() => {
          setShowProjectWizard(false);
          setEditingProject(null);
          fetchData();
        }}
      />

      {showProjectDetail && selectedProject && (
        <DashboardProjectDetail
          visible={showProjectDetail}
          project={selectedProject}
          onClose={() => setShowProjectDetail(false)}
          onRefresh={fetchData}
          onEdit={(p) => {
            setEditingProject(p);
            setShowProjectDetail(false);
            // Ensure wizard is triggered after detail closes
            setTimeout(() => setShowProjectWizard(true), 300);
          }}
        />
      )}

      <ContractSigningModal
        visible={showContractModal}
        deal={selectedDeal}
        onClose={() => setShowContractModal(false)}
        onShowSuccess={(msg) => {
          Alert.alert('Thành công', msg);
          fetchInvestmentDeals();
        }}
      />

      {showPaymentModal && selectedBookingForPayment && (
        <PaymentModal
          isVisible={showPaymentModal}
          bookingId={selectedBookingForPayment.id || selectedBookingForPayment.bookingId}
          price={selectedBookingForPayment.price || selectedBookingForPayment.estimatedPrice}
          advisorName={selectedBookingForPayment.advisorName}
          slotCount={selectedBookingForPayment.slotCount || 1}
          onClose={() => setShowPaymentModal(false)}
        onPaid={() => {
            setShowPaymentModal(false);
            setBookingsRefreshKey(prev => prev + 1);
          }}
        />
      )}

      <QuotaGuardModal
        visible={showAIQuotaModal}
        onClose={() => setShowAIQuotaModal(false)}
        onConfirm={handleConfirmAIAnalysis}
        type="ai"
        projectName={projectForAI?.projectName || projectForAI?.name}
        isProcessing={isEvaluatingAI}
        remaining={quota.remainingAiRequests}
        packageName={quota.packageName}
      />

      {showBookingModal && (
        <AdvisorBookingModal
          isVisible={showBookingModal}
          sourceBookingId={sourceBookingIdForRebook}
          onClose={() => {
            setShowBookingModal(false);
            setSourceBookingIdForRebook(null);
          }}
          onSuccess={() => {
            setShowBookingModal(false);
            setSourceBookingIdForRebook(null);
            setBookingsRefreshKey(prev => prev + 1);
          }}
        />
      )}

      <OnchainResultModal 
        visible={showOnchainModal}
        data={onchainData}
        onClose={() => setShowOnchainModal(false)}
      />

      <BookingChatModal
        isVisible={showChatModal}
        onClose={() => {
          setShowChatModal(false);
          setSelectedConnection(null);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        connection={selectedConnection}
        session={activeChatSession}
      />

      <InvestmentDealDetailModal
        visible={showDealDetailModal}
        onClose={() => setShowDealDetailModal(false)}
        deal={selectedDeal}
        onApprove={async (id) => {
          await handleApproveDeal(id);
          setShowDealDetailModal(false);
        }}
        onReject={async (id) => {
          await handleRejectDeal(id);
          setShowDealDetailModal(false);
        }}
        isResponding={isRespondingDealId !== null}
      />

      {isFetchingProject && (
        <Modal transparent visible={isFetchingProject}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
            <Card style={{ padding: 24, borderRadius: 20 }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: 12, fontWeight: '700', color: colors.text }}>Đang tải dự án...</Text>
            </Card>
          </View>
        </Modal>
      )}
    </View>
  );
}

function StatCard({ icon, value, label, colors, color, isDark }) {
  return (
    <View style={[styles.statCard, { 
      borderColor: colors.border, 
      backgroundColor: isDark ? 'transparent' : colors.secondaryBackground 
    }]}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>{icon}</View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.secondaryText }]}>{label}</Text>
    </View>
  );
}

function ProjectListItem({ project, colors, isDark, onPress }) {
  const statusColors = {
    Approved: { bg: colors.statusApprovedBg, text: colors.statusApprovedText, label: 'Đã duyệt' },
    Published: { bg: colors.statusApprovedBg, text: colors.statusApprovedText, label: 'Đã đăng' },
    Draft: { bg: colors.statusDraftBg, text: colors.statusDraftText, label: 'Bản nháp' },
    Pending: { bg: colors.statusPendingBg, text: colors.statusPendingText, label: 'Đang chờ' },
    Rejected: { bg: colors.statusRejectedBg, text: colors.statusRejectedText, label: 'Từ chối' },
  };
  const status = statusColors[project.status] || statusColors.Draft;

  return (
    <Card 
      style={[
        styles.projectItem, 
        { 
          borderColor: colors.border,
          backgroundColor: isDark ? 'transparent' : colors.secondaryBackground 
        }
      ]} 
      onPress={onPress}
    >
      <View style={styles.projectHeader}>
        <Text style={[styles.projectName, { color: colors.text }]} numberOfLines={1}>
          {project.projectName || project.name}
        </Text>
        <View style={[styles.statusBadgeRow, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusTextSmall, { color: status.text }]}>{status.label}</Text>
        </View>
      </View>
      <Text style={[styles.projectDesc, { color: colors.secondaryText }]} numberOfLines={2}>
        {project.shortDescription || project.description}
      </Text>
      <View style={styles.projectFooter}>
        <View style={styles.metaLabel}>
          <Target size={14} color={colors.accentCyan} />
          <Text style={[styles.projectMetaText, { color: colors.secondaryText }]}>
            {project.stage || 'Ý tưởng'}
          </Text>
        </View>
        <ChevronRight size={18} color={colors.border} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabBar: { borderBottomWidth: 1 },
  tabScrollContainer: { paddingHorizontal: 0 },
  tabLabel: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  labelContainer: { alignItems: 'center', justifyContent: 'center' },
  tabItem: {
    width: 100,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPill: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    borderRadius: 3,
  },
  tabContent: { padding: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 24 },
  statCard: { width: (width - 52) / 2, padding: 18, borderRadius: 24, borderWidth: 1 },
  statIconContainer: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  statValue: { fontSize: 24, fontWeight: '900', marginBottom: 4 },
  statLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', opacity: 0.7 },
  completionCard: { padding: 24, marginBottom: 24, borderRadius: 28 },
  completionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  cardTitle: { fontSize: 18, fontWeight: '900' },
  completionPercentage: { fontSize: 22, fontWeight: '900' },
  progressBarBg: { height: 10, borderRadius: 5, marginBottom: 16, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 5 },
  cardHint: { fontSize: 14, lineHeight: 20, marginBottom: 18, opacity: 0.8 },
  completionCta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ctaText: { fontSize: 15, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '900' },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 16 },
  emptyText: { fontSize: 16, fontWeight: '600' },
  projectItem: { padding: 20, marginBottom: 16, borderRadius: 28, borderWidth: 1 },
  projectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  projectName: { fontSize: 18, fontWeight: '800', flex: 1, marginRight: 10 },
  statusBadgeRow: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusTextSmall: { fontSize: 10, fontWeight: '800' },
  projectDesc: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  projectFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  projectMetaText: { fontSize: 12, fontWeight: '700' },
  aiActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  aiActionText: {
    fontSize: 12,
    fontWeight: '800',
  }
});
