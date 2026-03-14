import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TrendingUp, Users, FileText, CheckCircle, AlertCircle, Eye, Zap, MessageSquare, PlusCircle, ArrowRight, DollarSign, Heart, Calendar, Star } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import projectSubmissionService from '../../src/services/projectSubmissionService';
import startupProfileService from '../../src/services/startupProfileService';
import blockchainService from '../../src/services/blockchainService';
import projectValidationService from '../../src/services/projectValidationService';
import { useTheme } from '../../src/context/ThemeContext';
import Card from '../../src/components/Card';
import Button from '../../src/components/Button';
import StartupProfileForm from '../../src/components/StartupProfileForm';
import ProjectSubmissionWizard from '../../src/components/ProjectSubmissionWizard';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { activeTheme, isDark } = useTheme();
  const colors = activeTheme.colors;
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startupProfile, setStartupProfile] = useState(null);
  const [myProjects, setMyProjects] = useState([]);

  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      if (user.userId) {
        const profile = await startupProfileService.getStartupProfileByUserId(user.userId);
        setStartupProfile(profile);
      }
      
      const projectRes = await projectSubmissionService.getMyProjects();
      if (projectRes.success || projectRes.isSuccess) {
        const projects = Array.isArray(projectRes.data) ? projectRes.data : (projectRes.data.items || []);
        setMyProjects(projects);
      }
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>Vui lòng đăng nhập để xem bảng điều khiển</Text>
      </View>
    );
  }

  const [activeTab, setActiveTab] = useState('overview');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const renderStatCard = (icon, value, label, colorClass) => (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: colorClass + '15' }]}>
        {icon}
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </Card>
  );

  const ds = {
    greeting: { color: colors.text },
    subtitle: { color: colors.secondaryText },
    statValue: { color: colors.text },
    statLabel: { color: colors.secondaryText },
    tab: { backgroundColor: colors.secondaryBackground },
    activeTab: { backgroundColor: colors.primary },
    tabText: { color: colors.secondaryText },
    activeTabText: { color: '#fff' },
    cardTitle: { color: colors.text },
    completionPercent: { color: colors.primary },
    progressBar: { backgroundColor: colors.border },
    progressIndicator: { backgroundColor: colors.primary },
    progressHint: { color: colors.secondaryText },
    sectionTitle: { color: colors.text },
    projectName: { color: colors.text },
    statusBadge: { backgroundColor: colors.primary + '15' },
    statusText: { color: colors.primary },
    projectDesc: { color: colors.secondaryText },
    projectAction: { borderTopColor: colors.border },
    projectActionText: { color: colors.text },
    emptyText: { color: colors.secondaryText },
    actionRow: { borderTopColor: colors.border },
  };

  const calculateProfileCompletion = () => {
    if (!startupProfile) return 0;
    let points = 20;
    if (startupProfile.logoUrl) points += 10;
    if (startupProfile.companyName) points += 10;
    if (startupProfile.founder) points += 20;
    if (startupProfile.contactInfo) points += 10;
    if (startupProfile.countryCity) points += 10;
    if (startupProfile.website) points += 10;
    if (startupProfile.industry) points += 10;
    return points;
  };

  const handleProtectDocuments = async (project) => {
    setIsSubmitting(true);
    try {
      const result = await blockchainService.protectDocumentsOnBlockchain(['Business Plan.pdf', 'Financials.xlsx'], project.id);
      if (result.success) {
        Alert.alert('Thành công', 'Tài liệu đã được bảo vệ trên blockchain!');
        fetchDashboardData();
        // Trigger AI Evaluation after protection
        setTimeout(() => handleAIEvaluation(project), 1500);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể bảo vệ tài liệu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAIEvaluation = async (project) => {
    try {
      const res = await projectSubmissionService.triggerAIAnalysis(project.id);
      if (res.success) {
        Alert.alert('AI Evaluation', 'Phân tích AI đã hoàn thành!');
        fetchDashboardData();
      }
    } catch (error) {
      console.error('AI error:', error);
    }
  };

  const renderTabs = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
      {['overview', 'profile', 'projects', 'advisors'].map(tab => (
        <TouchableOpacity 
          key={tab} 
          onPress={() => setActiveTab(tab)}
          style={[styles.tab, ds.tab, activeTab === tab && ds.activeTab]}
        >
          <Text style={[styles.tabText, ds.tabText, activeTab === tab && ds.activeTabText]}>
            {tab === 'overview' ? 'Tổng quan' : 
             tab === 'profile' ? 'Hồ sơ' : 
             tab === 'projects' ? 'Dự án' : 'Cố vấn'}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderStartupDashboard = () => {
    const project = myProjects[0];
    const completion = calculateProfileCompletion();

    return (
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={[styles.greeting, ds.greeting]}>Xin chào, {user.name || 'Founder'}!</Text>
          <Text style={[styles.subtitle, ds.subtitle]}>Đây là tổng quan khởi nghiệp của bạn.</Text>
        </View>

        {renderTabs()}

        {activeTab === 'overview' && (
          <View>
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                {renderStatCard(<Eye size={20} color="#06b6d4" />, startupProfile?.followers?.length || 0, "Lượt xem", "#06b6d4")}
                {renderStatCard(<Users size={20} color="#eab308" />, 0, "Nhà đầu tư", "#eab308")}
              </View>
              <View style={styles.statsRow}>
                {renderStatCard(<FileText size={20} color="#10b981" />, 0, "Tài liệu", "#10b981")}
                {renderStatCard(<TrendingUp size={20} color="#a855f7" />, project?.aiEvaluation?.startupScore || 0, "Điểm AI", "#a855f7")}
              </View>
            </View>

            <Card style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={[styles.cardTitle, ds.cardTitle]}>Hoàn thiện hồ sơ</Text>
                <Text style={[styles.completionPercent, ds.completionPercent]}>{completion}%</Text>
              </View>
              <View style={[styles.progressBar, ds.progressBar]}>
                <View style={[styles.progressIndicator, ds.progressIndicator, { width: `${completion}%` }]} />
              </View>
              <Text style={[styles.progressHint, ds.progressHint]}>Hoàn thiện hồ sơ để thu hút nhiều nhà đầu tư hơn.</Text>
              <TouchableOpacity style={styles.completeInfoBtn} onPress={() => setActiveTab('profile')}>
                <Text style={[styles.completeInfoText, { color: colors.primary }]}>Điền thông tin đầy đủ</Text>
                <ArrowRight size={16} color={colors.primary} />
              </TouchableOpacity>
            </Card>

            {project ? (
              <Card style={styles.projectCard}>
                <View style={styles.projectHeader}>
                  <Text style={[styles.projectName, ds.projectName]}>{project.name || project.projectName}</Text>
                  <View style={[styles.statusBadge, ds.statusBadge, { backgroundColor: project.status === 'Published' ? '#D1FAE5' : colors.secondaryBackground }]}>
                    <Text style={[styles.statusText, { color: project.status === 'Published' ? '#059669' : colors.secondaryText }, project.status === 'Published' && { color: '#059669' }]}>{project.status || 'Draft'}</Text>
                  </View>
                </View>
                <Text style={[styles.projectDesc, ds.projectDesc]} numberOfLines={2}>{project.description || project.shortDescription}</Text>
                
                <View style={styles.actionRow}>
                  {!project.blockchainHash && (
                    <Button 
                      title="Bảo vệ IP" 
                      onPress={() => handleProtectDocuments(project)} 
                      loading={isSubmitting}
                      style={styles.actionBtn}
                    />
                  )}
                  {project.blockchainHash && !project.aiEvaluation && (
                    <Button 
                      title="Đánh giá AI" 
                      onPress={() => handleAIEvaluation(project)} 
                      secondary
                      style={styles.actionBtn}
                    />
                  )}
                </View>
              </Card>
            ) : (
              <Card style={styles.emptyCard}>
                <Text style={[styles.emptyText, ds.emptyText]}>Bạn chưa có dự án nào.</Text>
                <Button title="Tạo dự án mới" style={{marginTop: 12}} onPress={() => setActiveTab('projects')} />
              </Card>
            )}
          </View>
        )}

        {activeTab === 'profile' && (
          <StartupProfileForm 
            initialData={startupProfile} 
            user={user} 
            onSuccess={(data) => {
              setStartupProfile(data);
              setActiveTab('overview');
            }}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectSubmissionWizard 
            user={user} 
            onSuccess={() => {
              fetchDashboardData();
              setActiveTab('overview');
            }}
          />
        )}

        {activeTab === 'advisors' && (
          <View>
            <Text style={[styles.sectionTitle, ds.sectionTitle]}>Yêu cầu tư vấn</Text>
            <Card style={styles.emptyCard}>
              <Text style={[styles.emptyText, ds.emptyText]}>Chưa có yêu cầu nào mới.</Text>
            </Card>
          </View>
        )}
      </View>
    );
  };

  const renderInvestorDashboard = () => {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={[styles.greeting, ds.greeting]}>Xin chào, {user.name || 'Nhà đầu tư'}!</Text>
          <Text style={[styles.subtitle, ds.subtitle]}>Quản lý đầu tư và khám phá startup.</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
          {['overview', 'portfolio', 'watchlist', 'interests'].map(tab => (
            <TouchableOpacity 
              key={tab} 
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, ds.tab, activeTab === tab && ds.activeTab]}
            >
              <Text style={[styles.tabText, ds.tabText, activeTab === tab && ds.activeTabText]}>
                {tab === 'overview' ? 'Tổng quan' : 
                 tab === 'portfolio' ? 'Danh mục' : 
                 tab === 'watchlist' ? 'Theo dõi' : 'Quan tâm'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {activeTab === 'overview' && (
          <View>
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                {renderStatCard(<DollarSign size={20} color="#06b6d4" />, "$0", "Tổng đầu tư", "#06b6d4")}
                {renderStatCard(<TrendingUp size={20} color="#a855f7" />, 0, "Đang đầu tư", "#a855f7")}
              </View>
              <View style={styles.statsRow}>
                {renderStatCard(<Heart size={20} color="#ef4444" />, 0, "Theo dõi", "#ef4444")}
                {renderStatCard(<MessageSquare size={20} color="#10b981" />, 0, "Chấp nhận", "#10b981")}
              </View>
            </View>

            <Card style={styles.card}>
              <Text style={[styles.cardTitle, ds.cardTitle]}>Hoạt động gần đây</Text>
              <View style={styles.emptyCardContent}>
                <Text style={[styles.emptyText, ds.emptyText]}>Chưa có hoạt động nào mới.</Text>
              </View>
            </Card>
          </View>
        )}

        {activeTab === 'portfolio' && (
          <View>
            <Text style={[styles.sectionTitle, ds.sectionTitle]}>Đầu tư của tôi</Text>
            <Card style={styles.emptyCard}>
              <Text style={[styles.emptyText, ds.emptyText]}>Bạn chưa có khoản đầu tư nào đang hoạt động.</Text>
              <Button title="Khám phá Startup" style={{marginTop: 12}} onPress={() => router.push('/(tabs)')} />
            </Card>
          </View>
        )}

        {activeTab === 'watchlist' && (
          <View>
            <Text style={[styles.sectionTitle, ds.sectionTitle]}>Danh sách theo dõi</Text>
            <Card style={styles.emptyCard}>
              <Text style={[styles.emptyText, ds.emptyText]}>Danh sách theo dõi của bạn đang trống.</Text>
            </Card>
          </View>
        )}

        {activeTab === 'interests' && (
          <View>
            <Text style={[styles.sectionTitle, ds.sectionTitle]}>Quan tâm đã gửi</Text>
            <Card style={styles.emptyCard}>
              <Text style={[styles.emptyText, ds.emptyText]}>Bạn chưa gửi quan tâm đến startup nào.</Text>
            </Card>
          </View>
        )}
      </View>
    );
  };

  const renderAdvisorDashboard = () => (
    <View>
      <View style={styles.header}>
        <Text style={styles.greeting}>Xin chào, {user.name || 'Advisor'}!</Text>
        <Text style={styles.subtitle}>Quản lý hoạt động tư vấn của bạn.</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          {renderStatCard(<Users size={20} color="#a855f7" />, 0, "Khách hàng", "#a855f7")}
          {renderStatCard(<MessageSquare size={20} color="#eab308" />, 0, "Yêu cầu", "#eab308")}
        </View>
        <View style={styles.statsRow}>
          {renderStatCard(<Calendar size={20} color="#06b6d4" />, 0, "Lịch hẹn", "#06b6d4")}
          {renderStatCard(<Star size={20} color="#ef4444" />, 0, "Đánh giá", "#ef4444")}
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, ds.sectionTitle]}>Yêu cầu chờ xử lý</Text>
      </View>
      <Card style={styles.emptyCard}>
        <Text style={[styles.emptyText, ds.emptyText]}>Hiện không có yêu cầu nào.</Text>
      </Card>
    </View>
  );

  const isRole = (target) => {
    const userRole = String(user.role).toLowerCase();
    const targetRole = String(target).toLowerCase();
    
    // Map numbers to strings if needed
    const roleMap = {
      '0': 'startup',
      '1': 'investor',
      '2': 'advisor'
    };

    return userRole === targetRole || roleMap[userRole] === targetRole;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {isRole('startup') ? renderStartupDashboard() :
         isRole('investor') ? renderInvestorDashboard() :
         isRole('advisor') ? renderAdvisorDashboard() :
         <View style={styles.center}>
           <Text style={styles.emptyText}>Vai trò không hợp lệ: {user.role}</Text>
           <Button title="Đăng xuất" onPress={logout} style={{marginTop: 10}} />
         </View>}
      </ScrollView>
    </SafeAreaView>
  );
}

// Reuse some styles from earlier or define new ones
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  header: { marginBottom: 20 },
  greeting: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 4 },
  statsGrid: { marginBottom: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statCard: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12, marginRight: 6 },
  statIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 12 },
  tabContainer: { flexDirection: 'row', marginBottom: 20, paddingBottom: 5 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderRadius: 20 },
  activeTab: { },
  tabText: { fontSize: 14, fontWeight: '600' },
  activeTabText: { color: '#fff' },
  progressCard: { padding: 16, marginBottom: 24 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  completionPercent: { fontSize: 16, fontWeight: '700' },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  progressIndicator: { height: '100%' },
  progressHint: { fontSize: 13, marginBottom: 16 },
  completeInfoBtn: { flexDirection: 'row', alignItems: 'center' },
  completeInfoText: { fontWeight: '700', marginRight: 4, fontSize: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  projectCard: { padding: 16, marginBottom: 12 },
  projectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  projectName: { fontSize: 16, fontWeight: '700', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  projectDesc: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  projectAction: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 12, justifyContent: 'space-between', alignItems: 'center' },
  actionRow: { flexDirection: 'row', gap: 10, borderTopWidth: 1, paddingTop: 12 },
  actionBtn: { flex: 1 },
  projectActionText: { fontSize: 14, fontWeight: '600' },
  emptyCard: { padding: 24, alignItems: 'center' },
  emptyCardContent: { paddingVertical: 20, alignItems: 'center' },
  emptyText: { marginBottom: 12, textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});

const ChevronRight = ({ size, color }) => (
  <View style={{ transform: [{ rotate: '0deg' }] }}>
    <Text style={{ fontSize: size, color: color }}>→</Text>
  </View>
);
