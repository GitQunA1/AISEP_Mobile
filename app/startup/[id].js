import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Animated, Easing, Platform, Dimensions, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ArrowLeft, Target, ShieldCheck, Mail, MapPin, Search,
  Calendar, Briefcase, User, Star, BadgeCheck, CheckCircle,
  AlertCircle, DollarSign, BarChart3, Zap, Swords, TrendingUp, Users, ClipboardList
} from 'lucide-react-native';

import projectSubmissionService from '../../src/services/projectSubmissionService';
import AIEvaluationService from '../../src/services/AIEvaluationService';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DISPLAY = (val, fallback = 'Đang cập nhật') => val && String(val).trim() ? val : fallback;
const FORMAT_CURRENCY = (val) => val ? Number(val).toLocaleString('vi-VN') + ' VND' : '—';

const PremiumBadge = ({ colors, inline }) => (
  <View style={[styles.premiumBadge, { backgroundColor: colors.accentOrange + '20', borderWidth: 1, borderColor: colors.accentOrange + '40', alignSelf: inline ? 'auto' : 'flex-start', marginTop: inline ? 0 : 4 }]}>
    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.accentOrange }}>🔒 Premium</Text>
  </View>
);

const Field = ({ label, value, colors, isCurrency, isHighlight }) => (
  <View style={styles.fieldContainer}>
    <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{label}</Text>
    <View style={{ marginTop: 4 }}>
      {value === undefined ? (
        <PremiumBadge colors={colors} />
      ) : (
        <Text style={[
          styles.fieldValue,
          { color: isCurrency ? colors.accentCyan : isHighlight ? colors.accentPurple : colors.text },
          (isCurrency || isHighlight) && { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontWeight: '600' }
        ]}>
          {value || 'Không có thông tin'}
        </Text>
      )}
    </View>
  </View>
);

export default function StartupDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [aiHistory, setAiHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // The web chooses the API based on isFullView. Here we can determine it from the user's role/subscription
  // But generally, let's try the full API first or just the public API.
  const isInvestorOrPremium = user && (user.role === 'investor' || user.role === 'Investor' || String(user.role) === '1');

  useEffect(() => {
    const fetchProjectDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchMethod = isInvestorOrPremium 
            ? projectSubmissionService.getProjectById(id)
            : projectSubmissionService.getProjectNonPremiumById(id);
            
        const [pRes, aRes] = await Promise.all([
            fetchMethod,
            AIEvaluationService.getProjectAnalysisHistory(id).catch(() => null)
        ]);

        if (pRes?.success && pRes?.data) {
          const d = pRes.data;
          setProject({
            ...d,
            name: d.projectName || 'Dự án',
            stage: d.developmentStage || 'Ý tưởng',
            status: d.status || 'Pending',
            tags: d.keySkills ? d.keySkills.split(',').map(s => s.trim()).filter(Boolean) : [],
          });
        } else {
          setError(pRes?.message || 'Không tìm thấy thông tin dự án.');
        }

        if (aRes?.data) {
            setAiHistory(aRes.data);
        }
      } catch (err) {
        setError(err?.message || 'Lỗi khi tải dự án.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchProjectDetails();
  }, [id, user]);

  useEffect(() => {
    if (!isLoading && !error && project) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }
  }, [isLoading, error, project]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Đang tải thông tin dự án...</Text>
      </View>
    );
  }

  if (error || !project) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <AlertCircle size={48} color={colors.error} />
        <Text style={[styles.errorTitle, { color: colors.error }]}>Lỗi</Text>
        <Text style={[styles.errorText, { color: colors.secondaryText }]}>{error}</Text>
        <TouchableOpacity style={[styles.backBtnLarge, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
          <Text style={styles.backBtnTextLarge}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initial = project.name.charAt(0).toUpperCase();
  const isApproved = ['approved', 'Approved'].includes(project.status);
  const latestAI = aiHistory.length > 0
    ? (aiHistory[0].potentialScore ?? aiHistory[0].startupScore ?? null)
    : (project.startupPotentialScore ?? null);

  const getAvatarGradient = () => colors.primary; // fallback to primary

  const renderTeamMembers = () => {
    if (project.teamMembers === undefined) return <PremiumBadge colors={colors} />;
    if (!project.teamMembers) return <Text style={{ color: colors.secondaryText, fontSize: 14 }}>Đang cập nhật</Text>;
    
    return project.teamMembers.split(',').map((m, i, arr) => {
        const parts = m.split('-');
        const name = parts[0]?.trim() || 'Thành viên';
        const role = parts.slice(1).join('-').trim() || 'Thành viên cốt lõi';
        
        return (
            <View key={i} style={[styles.teamMemberRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <View style={[styles.teamAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.teamName, { color: colors.text }]}>{name}</Text>
                    <Text style={[styles.teamRole, { color: colors.secondaryText }]}>{role}</Text>
                </View>
            </View>
        );
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <ArrowLeft size={20} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{project.name}</Text>
                <Text style={[styles.headerSubtitle, { color: colors.secondaryText }]}>Chi tiết dự án</Text>
            </View>
            {isApproved && (
                <View style={[styles.approvedPill, { backgroundColor: colors.success + '20', borderColor: colors.success + '40' }]}>
                    <Text style={{ color: colors.success, fontSize: 11, fontWeight: '700' }}>✓ Đã duyệt</Text>
                </View>
            )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Banner */}
            <View style={[styles.banner, { backgroundColor: colors.mutedBackground }]} />

            {/* Profile Info */}
            <View style={styles.profileSection}>
                <View style={[styles.avatarContainer, { borderColor: colors.background, backgroundColor: getAvatarGradient() }]}>
                    <Text style={styles.avatarInitial}>{initial}</Text>
                </View>

                <Text style={[styles.projectName, { color: colors.text }]}>{project.name}</Text>
                <Text style={[styles.projectDesc, { color: colors.secondaryText }]}>{project.description}</Text>
                
                <View style={styles.tagsContainer}>
                    {project.tags.map((t, idx) => (
                        <Text key={idx} style={[styles.tag, { color: colors.primary }]}>#{t}</Text>
                    ))}
                </View>
            </View>

            {/* Metrics Grid */}
            <View style={[styles.metricsGrid, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
                <View style={[styles.metricBox, { borderRightColor: colors.border }]}>
                    <DollarSign size={20} color={colors.accentCyan} style={{ marginBottom: 4 }} />
                    <Text style={[styles.metricVal, { color: colors.accentCyan }]} numberOfLines={1}>
                        {project.revenue !== undefined ? (project.revenue ? FORMAT_CURRENCY(project.revenue) : '0 VND') : '🔒'}
                    </Text>
                    <Text style={[styles.metricLbl, { color: colors.secondaryText }]}>Doanh thu</Text>
                </View>
                <View style={[styles.metricBox, { borderRightColor: colors.border }]}>
                    <BarChart3 size={20} color={colors.accentGreen} style={{ marginBottom: 4 }} />
                    <Text style={[styles.metricVal, { color: colors.accentGreen }]} numberOfLines={1}>
                        {project.marketSize !== undefined ? (project.marketSize ? FORMAT_CURRENCY(project.marketSize) : '0 VND') : '🔒'}
                    </Text>
                    <Text style={[styles.metricLbl, { color: colors.secondaryText }]}>Thị trường</Text>
                </View>
                <View style={styles.metricBox}>
                    <Zap size={20} color={latestAI != null ? colors.accentOrange : colors.secondaryText} style={{ marginBottom: 4 }} />
                    <Text style={[styles.metricVal, { color: latestAI != null ? colors.accentOrange : colors.secondaryText }]} numberOfLines={1}>
                        {latestAI != null ? latestAI : 'Chưa có'}
                    </Text>
                    <Text style={[styles.metricLbl, { color: colors.secondaryText }]}>Điểm AI</Text>
                </View>
            </View>

            <View style={styles.contentSection}>
                {/* 1. Basic Info */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, ...activeTheme.shadows.sm }]}>
                    <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
                        <ClipboardList size={16} color={colors.primary} />
                        <Text style={[styles.cardTitle, { color: colors.primary }]}>THÔNG TIN CƠ BẢN</Text>
                    </View>
                    <View style={styles.cardBody}>
                        <Field label="Mô tả ngắn" value={project.shortDescription} colors={colors} />
                        <Field label="Giai đoạn phát triển" value={project.stage} colors={colors} />
                        <Field label="Vấn đề giải quyết" value={project.problemStatement} colors={colors} />
                        <Field label="Giải pháp đề xuất" value={project.solutionDescription} colors={colors} />
                    </View>
                </View>

                {/* 2. Team */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, ...activeTheme.shadows.sm }]}>
                    <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
                        <Users size={16} color={colors.accentPurple} />
                        <Text style={[styles.cardTitle, { color: colors.accentPurple }]}>ĐỘI NGŨ</Text>
                    </View>
                    <View style={styles.cardBody}>
                        <Text style={[styles.subHeading, { color: colors.secondaryText }]}>THÀNH VIÊN & VAI TRÒ</Text>
                        <View style={{ marginBottom: 16 }}>
                            {renderTeamMembers()}
                        </View>
                        
                        <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 12 }} />
                        <Field label="Kỹ năng cốt lõi" value={project.keySkills === undefined ? undefined : (project.keySkills || '—')} colors={colors} />
                    </View>
                </View>

                {/* 3. Market & Model */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, ...activeTheme.shadows.sm }]}>
                    <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
                        <TrendingUp size={16} color={colors.accentGreen} />
                        <Text style={[styles.cardTitle, { color: colors.accentGreen }]}>THỊ TRƯỜNG & MÔ HÌNH</Text>
                    </View>
                    <View style={styles.cardBody}>
                        <Field label="Khách hàng mục tiêu" value={project.targetCustomers} colors={colors} />
                        <Field label="Giá trị độc đáo (UVP)" value={project.uniqueValueProposition} colors={colors} />
                        <Field label="Quy mô thị trường" value={project.marketSize !== undefined ? FORMAT_CURRENCY(project.marketSize) : undefined} colors={colors} isCurrency />
                        <Field label="Doanh thu" value={project.revenue !== undefined ? FORMAT_CURRENCY(project.revenue) : undefined} colors={colors} isCurrency />
                        <Field label="Mô hình kinh doanh" value={project.businessModel} colors={colors} />
                    </View>
                </View>

                {/* 4. Competition */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, ...activeTheme.shadows.sm }]}>
                    <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
                        <Swords size={16} color={colors.error} />
                        <Text style={[styles.cardTitle, { color: colors.error }]}>CẠNH TRANH</Text>
                    </View>
                    <View style={styles.cardBody}>
                        <Field label="Đối thủ cạnh tranh" value={project.competitors} colors={colors} />
                    </View>
                </View>
            </View>
        </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, zIndex: 10 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  headerTitleContainer: { flex: 1, marginLeft: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSubtitle: { fontSize: 12 },
  approvedPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  banner: { height: 100, width: '100%' },
  profileSection: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20, marginTop: -40 },
  avatarContainer: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarInitial: { color: '#fff', fontSize: 28, fontWeight: '800' },
  projectName: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  projectDesc: { fontSize: 14, lineHeight: 22, marginBottom: 12 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { fontSize: 14, fontWeight: '600' },
  metricsGrid: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, marginHorizontal: 20, paddingVertical: 16, marginBottom: 20 },
  metricBox: { flex: 1, alignItems: 'center', borderRightWidth: 1, paddingHorizontal: 8 },
  metricVal: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  metricLbl: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  contentSection: { paddingHorizontal: 20, gap: 16 },
  card: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, gap: 8 },
  cardTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  cardBody: { padding: 16, gap: 16 },
  fieldContainer: { flexDirection: 'column' },
  fieldLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldValue: { fontSize: 14, lineHeight: 22 },
  subHeading: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
  teamMemberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  teamAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  teamName: { fontSize: 15, fontWeight: '700' },
  teamRole: { fontSize: 13, marginTop: 2 },
  loadingText: { marginTop: 12, fontSize: 14 },
  errorTitle: { fontSize: 20, fontWeight: '700', marginTop: 16 },
  errorText: { fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  backBtnLarge: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  backBtnTextLarge: { color: '#fff', fontWeight: '700' }
});
