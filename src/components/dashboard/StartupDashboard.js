import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, RefreshControl, ActivityIndicator, Dimensions, Modal, Alert
} from 'react-native';
import {
  TrendingUp, Users, FileText, CheckCircle,
  Eye, Plus, ChevronRight, Target, MessageSquare, Briefcase, Calendar
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
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
const { width } = Dimensions.get('window');

const TABS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'projects', label: 'Dự án' },
  { id: 'connections', label: 'Kết nối' },
  { id: 'bookings', label: 'Lịch tư vấn' },
  { id: 'deals', label: 'Đầu tư' },
  { id: 'profile', label: 'Hồ sơ' },
];

export default function StartupDashboard() {
  const { user } = useAuth();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const [activeTab, setActiveTab] = useState('overview');
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

  // Modal States
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);

  const scrollX = useRef(new Animated.Value(0)).current;
  const pagerRef = useRef(null);
  const tabsScrollRef = useRef(null);

  // SignalR Initialization
  useEffect(() => {
    const initSignalR = async () => {
      try {
        if (user?.userId) {
          // Assume signalRService is already initialized or handled in layout
        }
      } catch (err) {
        console.error('[StartupDashboard] SignalR error:', err);
      }
    };
    initSignalR();
  }, [user?.userId]);

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

      setStats({
        profileViews: profileRes?.followers?.length || 0,
        investorInterests: investorRequests.length,
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
        connectionRequestId: req.connectionRequestId,
        investorName: req.investorName || 'NĐT',
        status: req.status?.toLowerCase() || 'pending',
        message: req.message || '',
        sentDate: req.responseDate ? new Date(req.responseDate).toLocaleString('vi-VN') : 'Mới đây',
        chatSessionId: req.chatSessionId
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
      setInvestmentDeals(Array.isArray(response?.data) ? response.data : (response?.data?.items || []));
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
      tabsScrollRef.current.scrollTo({ x: Math.max(0, tabIndex * tabWidth - width / 3), animated: true });
    }
  };

  const handlePagerScroll = (event) => {
    const x = event.nativeEvent.contentOffset.x;
    const tabIndex = Math.round(x / width);
    if (TABS[tabIndex] && TABS[tabIndex].id !== activeTab) {
      setActiveTab(TABS[tabIndex].id);
      if (tabsScrollRef.current) {
        const tabWidth = width / 3.5;
        tabsScrollRef.current.scrollTo({ x: Math.max(0, tabIndex * tabWidth - width / 3), animated: true });
      }
    }
  };

  const handleApproveConnection = async (id) => {
    try {
      const res = await connectionService.respondToConnection(id, true);
      if (res) {
        Alert.alert('Thành công', 'Đã chấp nhận yêu cầu kết nối.');
        fetchInvestorRequests();
      }
    } catch (err) { Alert.alert('Lỗi', 'Không thể xử lý yêu cầu.'); }
  };

  const handleRejectConnection = async (id) => {
    try {
      const res = await connectionService.respondToConnection(id, false);
      if (res) {
        Alert.alert('Xác nhận', 'Đã từ chối yêu cầu.');
        fetchInvestorRequests();
      }
    } catch (err) { Alert.alert('Lỗi', 'Không thể xử lý yêu cầu.'); }
  };

  const handleApproveDeal = async (id) => {
    setIsRespondingDealId(id);
    try {
      const res = await dealsService.respondToDeal(id, true);
      if (res?.success || res?.data) {
        Alert.alert('Thành công', 'Đã chấp nhận đầu tư!');
        fetchInvestmentDeals();
      }
    } catch (err) { Alert.alert('Lỗi', 'Không thể xử lý đầu tư.'); }
    finally { setIsRespondingDealId(null); }
  };

  const handleRejectDeal = async (id) => {
    setIsRespondingDealId(id);
    try {
      const res = await dealsService.respondToDeal(id, false);
      if (res?.success || res?.data) {
        Alert.alert('Xác nhận', 'Đã từ chối đầu tư.');
        fetchInvestmentDeals();
      }
    } catch (err) { Alert.alert('Lỗi', 'Không thể xử lý.'); }
    finally { setIsRespondingDealId(null); }
  };

  const handleAIEvaluation = async (projectId) => {
    setIsEvaluatingAI(true);
    try {
      const res = await projectSubmissionService.triggerAIAnalysis(projectId);
      if (res?.success || res?.isSuccess) {
        Alert.alert('Thành công', 'Đang tiến hành đánh giá AI. Kết quả sẽ được cập nhật sau vài giây.');
        fetchData();
      } else {
        Alert.alert('Lỗi', res?.message || 'Không thể kích hoạt đánh giá AI');
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Lỗi kết nối máy chủ');
    } finally {
      setIsEvaluatingAI(false);
    }
  };

  const renderOverview = () => (
    <FadeInView style={styles.tabContent}>
      <View style={styles.statsGrid}>
        <FadeInView delay={0}>
          <StatCard
            icon={<Eye size={22} color={colors.accentCyan} />}
            value={stats.profileViews}
            label="Lượt xem"
            colors={colors}
            color={colors.accentCyan}
          />
        </FadeInView>
        <FadeInView delay={100}>
          <StatCard
            icon={<Users size={22} color={colors.accentOrange} />}
            value={stats.investorInterests}
            label="NĐT quan tâm"
            colors={colors}
            color={colors.accentOrange}
          />
        </FadeInView>
        <FadeInView delay={200}>
          <StatCard
            icon={<Briefcase size={22} color={colors.accentGreen} />}
            value={investmentDeals.length}
            label="Đề xuất đầu tư"
            colors={colors}
            color={colors.accentGreen}
          />
        </FadeInView>
        <FadeInView delay={300}>
          <StatCard
            icon={<TrendingUp size={22} color={colors.accentPurple} />}
            value={stats.aiScore}
            label="Điểm AI"
            colors={colors}
            color={colors.accentPurple}
          />
        </FadeInView>
      </View>

      <Card style={styles.completionCard}>
        <View style={styles.completionHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Độ hoàn thiện hồ sơ</Text>
          <Text style={[styles.completionPercentage, { color: colors.primary }]}>{stats.completion}%</Text>
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: colors.mutedBackground }]}>
          <View style={[styles.progressBarFill, { backgroundColor: colors.primary, width: `${stats.completion}%` }]} />
        </View>
        <Text style={[styles.cardHint, { color: colors.secondaryText }]}>
          Hoàn thiện hồ sơ để thu hút thêm nhiều nhà đầu tư và cố vấn.
        </Text>
        <TouchableOpacity style={styles.completionCta} onPress={() => handleTabChange('profile')}>
          <Text style={[styles.ctaText, { color: colors.primary }]}>Cập nhật ngay</Text>
          <ChevronRight size={16} color={colors.primary} />
        </TouchableOpacity>
      </Card>

      <AIScoreCard
        score={stats.aiScore}
        onRefresh={() => {
          if (myProjects.length > 0) handleAIEvaluation(myProjects[0].id || myProjects[0].projectId);
          else Alert.alert('Chưa có dự án', 'Vui lòng tạo dự án trước khi yêu cầu đánh giá AI.');
        }}
        loading={isEvaluatingAI}
      />
    </FadeInView>
  );

  const renderProjects = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Dự án của tôi</Text>
      </View>

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
          <ScrollView>{renderProjects()}</ScrollView>
        </View>

        <View style={{ width }}>
          <View style={{ flex: 1, paddingHorizontal: 0, paddingTop: 20 }}>
            <InvestorConnectionRequests
              requests={investorRequests}
              isLoading={isLoadingRequests}
              onApprove={handleApproveConnection}
              onReject={handleRejectConnection}
              onChat={(req) => { /* Handle chat */ }}
              onRefresh={fetchInvestorRequests}
            />
          </View>
        </View>

        <View style={{ width }}>
          <StartupBookings 
            refreshKey={bookingsRefreshKey}
            onAction={(action, item) => {
              if (action === 'chat') { /* Chat logic handled inside StartupBookings */ }
              if (action === 'pay') {
                setSelectedBookingForPayment(item);
                setShowPaymentModal(true);
              }
            }} 
          />
        </View>

        <View style={{ width }}>
          <InvestmentDeals
            deals={investmentDeals}
            isLoading={isLoadingDeals}
            onApprove={handleApproveDeal}
            onReject={handleRejectDeal}
            onSign={(deal) => { setSelectedDeal(deal); setShowContractModal(true); }}
            onRefresh={fetchInvestmentDeals}
            isRespondingId={isRespondingDealId}
          />
        </View>

        <View style={{ width }}>
          <ScrollView>
            <StartupProfileForm
              initialData={startupProfile}
              user={user}
              onSuccess={(data) => { setStartupProfile(data); fetchData(); }}
            />
          </ScrollView>
        </View>
      </ScrollView>

      <Modal
        visible={showProjectWizard}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowProjectWizard(false)}
      >
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
      </Modal>

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
    </View>
  );
}

function StatCard({ icon, value, label, colors, color }) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>{icon}</View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.secondaryText }]}>{label}</Text>
    </View>
  );
}

function ProjectListItem({ project, colors, onPress }) {
  const statusColors = {
    Approved: { bg: colors.statusApprovedBg, text: colors.statusApprovedText, label: 'Đã duyệt' },
    Published: { bg: colors.statusApprovedBg, text: colors.statusApprovedText, label: 'Đã đăng' },
    Draft: { bg: colors.statusDraftBg, text: colors.statusDraftText, label: 'Bản nháp' },
    Pending: { bg: colors.statusPendingBg, text: colors.statusPendingText, label: 'Đang chờ' },
    Rejected: { bg: colors.statusRejectedBg, text: colors.statusRejectedText, label: 'Từ chối' },
  };
  const status = statusColors[project.status] || statusColors.Draft;

  return (
    <Card style={[styles.projectItem, { borderColor: colors.border }]} onPress={onPress}>
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
  tabScrollContainer: { paddingHorizontal: 10 },
  tabItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: { fontSize: 14, fontWeight: '800' },
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
  projectMetaText: { fontSize: 12, fontWeight: '700' }
});
