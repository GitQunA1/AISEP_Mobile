import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Animated, RefreshControl, ActivityIndicator, Dimensions, Modal
} from 'react-native';
import { 
  TrendingUp, Users, FileText, CheckCircle, 
  AlertCircle, Eye, Shield, Zap, Plus, ChevronRight, Target
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import TabScreenWrapper from '../../src/components/navigation/TabScreenWrapper';
import Card from '../../src/components/Card';
import Button from '../../src/components/Button';
import FadeInView from '../../src/components/FadeInView';
import startupProfileService from '../../src/services/startupProfileService';
import projectSubmissionService from '../../src/services/projectSubmissionService';
import advisorService from '../../src/services/advisorService';

// Import child components (to be implemented/refined)
import StartupProfileForm from '../../src/components/dashboard/StartupProfileForm';
import DashboardProjectDetail from '../../src/components/dashboard/DashboardProjectDetail';
import AIScoreCard from '../../src/components/dashboard/AIScoreCard';
import AdvisorConnectionRequests from '../../src/components/dashboard/AdvisorConnectionRequests';
import ProjectSubmissionWizard from '../../src/components/ProjectSubmissionWizard';

const { width } = Dimensions.get('window');

const TABS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'profile', label: 'Hồ sơ' },
  { id: 'projects', label: 'Dự án' },
  { id: 'advisors', label: 'Cố vấn' },
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
  const [stats, setStats] = useState({
    profileViews: 0,
    investorInterests: 0,
    documentsUploaded: 0,
    aiScore: 0,
    completion: 0
  });

  // Modal States
  const [showProjectWizard, setShowProjectWizard] = useState(false);
  const [showProjectDetail, setShowProjectDetail] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Animations
  const tabScrollX = useRef(new Animated.Value(0)).current;

  const fetchData = async () => {
    if (!user?.userId) return;
    
    try {
      const [profileRes, projectsRes, advisorsRes] = await Promise.all([
        startupProfileService.getStartupProfileByUserId(user.userId),
        projectSubmissionService.getMyProjects(),
        advisorService.getAdvisorRequests?.() || Promise.resolve([]) 
      ]);

      setStartupProfile(profileRes);
      
      const projects = Array.isArray(projectsRes?.data) ? projectsRes.data : (projectsRes?.data?.items || []);
      setMyProjects(projects);
      
      // Calculate completion
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

      // Get document count exactly like Web (fetching per project)
      let docCount = 0;
      if (projects.length > 0) {
        try {
          const docPromises = projects.map(p => 
            projectSubmissionService.getDocuments(p.projectId || p.id)
          );
          const docResponses = await Promise.all(docPromises);
          
          docCount = docResponses.reduce((acc, res) => {
            if (res && res.data) {
              const docs = Array.isArray(res.data) ? res.data : (res.data.items || []);
              return acc + docs.length;
            }
            return acc;
          }, 0);
        } catch (docErr) {
          console.error('Error fetching all docs:', docErr);
        }
      }

      setStats({
        profileViews: profileRes?.followers?.length || 0,
        investorInterests: 0,
        documentsUploaded: docCount,
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

  useEffect(() => {
    fetchData();
  }, [user]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const scrollX = useRef(new Animated.Value(0)).current;
  const pagerRef = useRef(null);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const tabIndex = TABS.findIndex(t => t.id === tabId);
    if (tabIndex !== -1 && pagerRef.current) {
      pagerRef.current.scrollTo({ x: tabIndex * width, animated: true });
    }
  };

  const handlePagerScroll = (event) => {
    const x = event.nativeEvent.contentOffset.x;
    const tabIndex = Math.round(x / width);
    if (TABS[tabIndex] && TABS[tabIndex].id !== activeTab) {
      setActiveTab(TABS[tabIndex].id);
    }
  };

  // Interpolate indicator position
  const indicatorTranslateX = scrollX.interpolate({
    inputRange: TABS.map((_, i) => i * width),
    outputRange: TABS.map((_, i) => i * (width / TABS.length)),
    extrapolate: 'clamp',
  });

  const [isEvaluatingAI, setIsEvaluatingAI] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const handleEditProject = (project) => {
    setEditingProject(project);
    setShowProjectDetail(false);
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

  const handleAdvisorAction = async (requestId, action) => {
    try {
      // Logic for advisor action using advisorService
      // For now using a placeholder if backend endpoint is generic
      // const res = await advisorService.handleRequest(requestId, action);
      
      // Mock update local state for immediate feedback
      setAdvisorRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status: action === 'accept' ? 'accepted' : 'rejected' } : req
      ));
      
      Alert.alert('Thành công', action === 'accept' ? 'Đã chấp nhận yêu cầu kết nối.' : 'Đã từ chối yêu cầu.');
      fetchData();
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể xử lý yêu cầu.');
    }
  };

  const renderOverview = () => (
    <FadeInView style={styles.tabContent}>
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard 
          icon={<Eye size={22} color={colors.accentCyan} />} 
          value={stats.profileViews} 
          label="Lượt xem" 
          colors={colors}
          color={colors.accentCyan}
        />
        <StatCard 
          icon={<Users size={22} color={colors.accentOrange} />} 
          value={stats.investorInterests} 
          label="NĐT quan tâm" 
          colors={colors}
          color={colors.accentOrange}
        />
        <StatCard 
          icon={<FileText size={22} color={colors.accentGreen} />} 
          value={stats.documentsUploaded} 
          label="Tài liệu" 
          colors={colors}
          color={colors.accentGreen}
        />
        <StatCard 
          icon={<TrendingUp size={22} color={colors.accentPurple} />} 
          value={stats.aiScore} 
          label="Điểm AI" 
          colors={colors}
          color={colors.accentPurple}
        />
      </View>

      {/* Profile Completion */}
      <Card style={styles.completionCard}>
        <View style={styles.completionHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Độ hoàn thiện hồ sơ</Text>
          <Text style={[styles.completionPercentage, { color: colors.primary }]}>{stats.completion}%</Text>
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: colors.mutedBackground }]}>
          <Animated.View 
            style={[
              styles.progressBarFill, 
              { 
                backgroundColor: colors.primary,
                width: `${stats.completion}%` 
              }
            ]} 
          />
        </View>
        <Text style={[styles.cardHint, { color: colors.secondaryText }]}>
          Hoàn thiện hồ sơ để thu hút thêm nhiều nhà đầu tư và cố vấn.
        </Text>
        <TouchableOpacity 
          style={styles.completionCta}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.ctaText, { color: colors.primary }]}>Cập nhật ngay</Text>
          <ChevronRight size={16} color={colors.primary} />
        </TouchableOpacity>
      </Card>

      {/* AI Potential Card */}
      <AIScoreCard 
        score={stats.aiScore} 
        onRefresh={() => {
          if (myProjects.length > 0) {
            // Trigger evaluation for the first project as a shortcut
            // In a more complex app, the user would select which project to evaluate
            handleAIEvaluation(myProjects[0].id || myProjects[0].projectId);
          } else {
            Alert.alert('Chưa có dự án', 'Vui lòng tạo dự án trước khi yêu cầu đánh giá AI.');
          }
        }}
        loading={isEvaluatingAI}
      />

    </FadeInView>
  );

  const renderProfile = () => (
    <View style={styles.tabContent}>
      <StartupProfileForm 
        initialData={startupProfile} 
        user={user} 
        onSuccess={(data) => {
          setStartupProfile(data);
          fetchData(); // Refresh stats
        }} 
      />
    </View>
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
          <ProjectListItem 
            key={project.id || idx} 
            project={project} 
            colors={colors} 
            onPress={() => {
              setSelectedProject(project);
              setShowProjectDetail(true);
            }}
          />
        ))
      )}
    </View>
  );

  const renderAdvisors = () => (
    <View style={styles.tabContent}>
      <AdvisorConnectionRequests 
        requests={advisorRequests}
        onAccept={(id) => handleAdvisorAction(id, 'accept')}
        onReject={(id) => handleAdvisorAction(id, 'reject')}
      />
    </View>
  );

  return (
    <TabScreenWrapper>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Tab Switcher */}
        <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
          <View style={styles.tabScrollContainer}>
            {TABS.map((tab, i) => {
              const opacity = scrollX.interpolate({
                inputRange: [(i - 0.7) * width, i * width, (i + 0.7) * width],
                outputRange: [0, 1, 0],
                extrapolate: 'clamp',
              });

              const inactiveOpacity = scrollX.interpolate({
                inputRange: [(i - 0.7) * width, i * width, (i + 0.7) * width],
                outputRange: [1, 0, 1],
                extrapolate: 'clamp',
              });

              const scale = scrollX.interpolate({
                inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                outputRange: [1, 1.05, 1],
                extrapolate: 'clamp',
              });

              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => handleTabChange(tab.id)}
                  style={styles.tabItem}
                >
                  <View style={styles.tabLabelContainer}>
                    {/* Inactive Label (Animated Opacity) */}
                    <Animated.Text style={[styles.tabLabel, { color: colors.secondaryText, opacity: inactiveOpacity }]}>
                      {tab.label}
                    </Animated.Text>
                    {/* Active Label (Animated Opacity) */}
                    <Animated.Text style={[
                      styles.tabLabel, 
                      styles.activeTabLabelAbsolute,
                      { 
                        color: colors.primary,
                        opacity,
                        transform: [{ scale }]
                      }
                    ]}>
                      {tab.label}
                    </Animated.Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            <Animated.View 
              style={[
                styles.tabIndicator, 
                { 
                  width: width / TABS.length, 
                  backgroundColor: colors.primary,
                  transform: [{ translateX: indicatorTranslateX }]
                }
              ]} 
            />
          </View>
        </View>

        <Animated.ScrollView 
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          onMomentumScrollEnd={handlePagerScroll}
          bounces={false}
          scrollEventThrottle={16}
        >
          {/* TAB 1: OVERVIEW */}
          <View style={{ width }}>
            <ScrollView 
              refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              {renderOverview()}
            </ScrollView>
          </View>

          {/* TAB 2: PROFILE */}
          <View style={{ width }}>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
              {renderProfile()}
            </ScrollView>
          </View>

          {/* TAB 3: PROJECTS */}
          <View style={{ width }}>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
              {renderProjects()}
            </ScrollView>
          </View>

          {/* TAB 4: ADVISORS */}
          <View style={{ width }}>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
              {renderAdvisors()}
            </ScrollView>
          </View>
        </Animated.ScrollView>

        {/* Modals */}
        {showProjectWizard && (
          <ProjectSubmissionWizard 
            visible={showProjectWizard}
            onClose={() => setShowProjectWizard(false)}
            onSuccess={() => {
              setShowProjectWizard(false);
              fetchData();
            }}
            initialData={null}
          />
        )}

        {showProjectDetail && selectedProject && (
          <DashboardProjectDetail 
            visible={showProjectDetail}
            project={selectedProject}
            onClose={() => setShowProjectDetail(false)}
            onRefresh={fetchData}
            onEdit={handleEditProject}
          />
        )}

        {/* Project Update Wizard */}
        {editingProject && (
          <Modal visible={!!editingProject} animationType="slide">
            <ProjectSubmissionWizard 
              user={user}
              initialData={editingProject}
              onSuccess={() => {
                setEditingProject(null);
                fetchData();
              }}
              onCancel={() => setEditingProject(null)}
            />
          </Modal>
        )}
      </View>
    </TabScreenWrapper>
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
        <View style={styles.projectInfo}>
          <Text style={[styles.projectName, { color: colors.text }]} numberOfLines={1}>
            {project.projectName || project.name}
          </Text>
        </View>
        <TouchableOpacity style={[styles.chevronContainer, { backgroundColor: colors.mutedBackground }]}>
          <ChevronRight size={18} color={colors.secondaryText} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.projectDesc, { color: colors.secondaryText }]} numberOfLines={2}>
        {project.shortDescription || project.description}
      </Text>
      <View style={styles.projectFooter}>
        <View style={styles.metaItem}>
          <Target size={14} color={colors.accentCyan} />
          <Text style={[styles.projectMeta, { color: colors.secondaryText }]}>
             {project.stage || project.developmentStage === 0 ? 'Ý tưởng' : project.developmentStage === 1 ? 'MVP' : project.developmentStage === 2 ? 'Tăng trưởng' : 'Ý tưởng'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg, marginLeft: 'auto' }]}>
          <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingTop: 8,
  },
  tabScrollContainer: {
    flexDirection: 'row',
    width: width,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  activeTabLabel: {
    fontWeight: '900',
  },
  tabLabelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabLabelAbsolute: {
    position: 'absolute',
    fontWeight: '900',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    borderRadius: 3,
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (width - 52) / 2,
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  completionCard: {
    padding: 24,
    marginBottom: 24,
    borderRadius: 28,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  completionPercentage: {
    fontSize: 22,
    fontWeight: '900',
  },
  progressBarBg: {
    height: 10,
    borderRadius: 5,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  cardHint: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
    opacity: 0.8,
  },
  completionCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  projectItem: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 28,
    borderWidth: 1,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  projectDesc: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  projectFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  projectMeta: {
    fontSize: 13,
    fontWeight: '600',
  },
  chevronContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
