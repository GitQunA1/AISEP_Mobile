import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking, Dimensions, Image, Modal, Platform } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ExpoLinking from 'expo-linking';
import { Lock, Zap, Brain, Sparkles, Crown } from 'lucide-react-native';

import projectSubmissionService from '../../src/services/projectSubmissionService';
import startupProfileService from '../../src/services/startupProfileService';
import AIEvaluationService from '../../src/services/AIEvaluationService';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useSubscription } from '../../src/context/SubscriptionContext';
import QuotaGuardModal from '../../src/components/common/QuotaGuardModal';
import AIEvaluationModal from '../../src/components/common/AIEvaluationModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function StartupDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { activeTheme, isDark } = useTheme();
  const colors = activeTheme.colors;
  const { user } = useAuth();
  const { subscription, quota, isPremium, startupProfile, refreshSubscription } = useSubscription();

  const roleStr = String(user?.role || '').toLowerCase();
  const isInvestor = user && (roleStr === 'investor' || user.role === 1);
  const isStartupUser = user && (roleStr === 'startup' || user.role === 0);
  const bypassRole = ['staff', 'operationstaff', 'advisor', 'admin'].includes(roleStr) || [2, 3, 4, 5].includes(user?.role);
  const isEligible = isInvestor || isStartupUser;

  const [project, setProject] = useState(null);
  const [isManualUnlocked, setIsManualUnlocked] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [aiHistory, setAiHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Quota Guard Modal state
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showAIResultModal, setShowAIResultModal] = useState(false);

  // Hide tab bar and default header
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });

    // Hide parent tab bar if it exists
    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.setOptions({
        tabBarStyle: { display: 'none' },
      });
    }

    return () => {
      if (parentNav) {
        parentNav.setOptions({
          tabBarStyle: undefined,
        });
      }
    };
  }, [navigation]);

  const loadProjectDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {


      // Always start with non-premium endpoint, then check if we should fetch full
      const [pRes, dRes, aRes] = await Promise.all([
        projectSubmissionService.getProjectNonPremiumById(id),
        projectSubmissionService.getDocuments(id).catch(() => null),
        AIEvaluationService.getProjectAnalysisHistory(id).catch(() => null)
      ]);

      if (pRes?.success && pRes?.data) {
        let projectData = pRes.data;
        let ownerConfirmed = false;

        // Startup ownership check
        if (isStartupUser && startupProfile && projectData.startupId === startupProfile.id) {
          ownerConfirmed = true;
          setIsOwner(true);
        }

        // Fetch full data if owned, already unlocked, or user is a bypass role (Staff/Admin/Advisor)
        // Note: For regular Investors/Startups, they must unlock first unless they already did.
        const shouldFetchFull = ownerConfirmed || projectData.isUnlockedByCurrentUser || isManualUnlocked || bypassRole;

        if (shouldFetchFull) {
          const fullRes = await projectSubmissionService.getProjectById(id);
          if (fullRes?.success && fullRes.data) projectData = fullRes.data;
        }

        setProject({
          ...projectData,
          name: projectData.projectName || 'Dự án',
          stage: projectData.developmentStage || 'Ý tưởng',
          status: projectData.status || 'Pending',
          tags: projectData.keySkills ? projectData.keySkills.split(',').map(s => s.trim()).filter(Boolean) : [],
        });
      } else {
        setError(pRes?.message || 'Không tìm thấy thông tin dự án.');
      }

      if (dRes?.data) {
        const items = dRes.data.items || dRes.data;
        setDocuments(Array.isArray(items) ? items : []);
      }

      if (aRes?.data) {
        setAiHistory(Array.isArray(aRes.data) ? aRes.data : [aRes.data]);
      }
    } catch (err) {
      console.error('ProjectDetail fetch error:', err);
      setError('Không thể tải dữ liệu dự án');
    } finally {
      setIsLoading(false);
    }
  }, [id, user, isManualUnlocked]);

  useEffect(() => {
    loadProjectDetail();
  }, [loadProjectDetail]);

  const handleOpenDocument = (url) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {
      Alert.alert('Lỗi', 'Không thể mở tài liệu này');
    });
  };

  // Unlock project - consumes 1 project view quota
  const handleUnlockProject = async () => {
    setIsUnlocking(true);
    try {
      const res = await projectSubmissionService.getProjectById(id);
      if (res?.success && res?.data) {
        const d = res.data;
        setIsManualUnlocked(true);
        setProject({
          ...d,
          name: d.projectName || 'Dự án',
          stage: d.developmentStage || 'Ý tưởng',
          status: d.status || 'Pending',
          tags: d.keySkills ? d.keySkills.split(',').map(s => s.trim()).filter(Boolean) : [],
        });
        setShowUnlockModal(false);
        refreshSubscription(); // Refresh quota after consuming
        
        // Silently reload to ensure all documents and history are updated with full access
        loadProjectDetail();
      } else {
        Alert.alert('Lỗi', res?.message || 'Không thể mở khóa dự án này.');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Lỗi khi mở khóa dự án.';
      Alert.alert('Lỗi', msg);
    } finally {
      setIsUnlocking(false);
    }
  };

  // AI Analyze - consumes 1 AI request quota
  const handleAIAnalyze = async () => {
    setIsAnalyzingAI(true);
    try {
      const res = await AIEvaluationService.analyzeProjectAPI(id);
      if (res.success && res.data) {
        setAiResult(res.data);
        setShowAIModal(false);
        setShowAIResultModal(true);
        refreshSubscription();
        // Reload AI history
        const hRes = await AIEvaluationService.getProjectAnalysisHistory(id);
        if (hRes?.data) setAiHistory(hRes.data);
      } else {
        Alert.alert('Lỗi AI', res.message || 'Có lỗi xảy ra khi thực hiện phân tích AI.');
      }
    } catch (err) {
      Alert.alert('Lỗi', err?.message || 'Không thể kết nối với hệ thống AI.');
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  // Determine if current user is Startup role (for unlock/AI logic)
  const isAlreadyUnlocked = project?.isUnlockedByCurrentUser || isOwner || isManualUnlocked || bypassRole;
  // isPremiumUnlockable: user has a paid subscription AND has remaining views
  const canUnlock = isEligible && isPremium && quota.remainingProjectViews > 0 && !isAlreadyUnlocked;
  const canAIAnalyze = isEligible && isPremium && quota.remainingAiRequests > 0;

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !project) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Ionicons name="alert-circle-outline" size={48} color={activeTheme.colors.error || '#E05252'} />
        <Text style={{ color: colors.text, fontSize: 16, marginTop: 12, textAlign: 'center' }}>{error}</Text>
        <TouchableOpacity
          onPress={() => loadProjectDetail()}
          style={{ marginTop: 16, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const AVATAR_PALETTE = ['#E05252', '#E07D52', '#7B52E0', '#52C07B', '#C05290', '#4A90D9', '#D4A017'];
  const getAvatarColor = (name) => {
    const hash = [...(name || '')].reduce((a, c) => a + c.charCodeAt(0), 0);
    return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
  };

  const formatCurrency = (n) => {
    if (!n) return '0 đ';
    if (n >= 1000000000) return `${(n / 1000000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} Tỷ VND`;
    if (n >= 1000000) return `${(n / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} Tr VND`;
    return `${n.toLocaleString('vi-VN')} VND`;
  };
  const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const FieldLabel = ({ children }) => (
    <Text style={{
      fontSize: 10.5, fontWeight: '900', color: isDark ? colors.secondaryText : '#475569',
      letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6,
    }}>
      {children}
    </Text>
  );

  const PremiumBadge = ({ onPress }) => (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={onPress || (() => setShowUnlockModal(true))}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: isDark ? '#3D2B00' : '#FFF9E6',
        paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: 6, alignSelf: 'flex-start',
        borderWidth: isDark ? 0 : 1,
        borderColor: isDark ? 'transparent' : '#FEF3C7',
      }}
    >
      <Ionicons name="lock-closed" size={13} color={isDark ? '#F5A623' : '#B45309'} />
      <Text style={{ fontSize: 12, color: isDark ? '#F5A623' : '#B45309', fontWeight: '800' }}>{isPremium ? 'MỞ KHÓA NGAY' : 'PREMIUM'}</Text>
    </TouchableOpacity>
  );

  const Divider = () => (
    <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 12 }} />
  );

  const SectionCard = ({ icon, title, accentColor, hasBorderAccent, children }) => (
    <View style={{
      backgroundColor: colors.mutedBackground || (isDark ? '#111827' : '#F8FAFC'),
      borderRadius: 12,
      marginHorizontal: 16,
      marginBottom: 16,
      overflow: 'hidden',
      ...(hasBorderAccent && {
        borderWidth: 1,
        borderColor: accentColor || colors.primary,
      }),
    }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
      }}>
        {icon}
        <Text style={{
          fontSize: 11, fontWeight: '900', color: accentColor || colors.primary,
          letterSpacing: 1.5, textTransform: 'uppercase',
        }}>
          {title}
        </Text>
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        {children}
      </View>
    </View>
  );

  const STAGE_CONFIG = {
    Idea: { color: '#F5A623', bg: isDark ? '#3D2B00' : '#FFF9E6', icon: 'bulb-outline' },
    MVP: { color: '#2D7EFF', bg: isDark ? '#002B4D' : '#EBF5FF', icon: 'rocket-outline' },
    Growth: { color: '#27AE60', bg: isDark ? '#003D1A' : '#E6FFFA', icon: 'trending-up-outline' },
  };

  const StageBadge = ({ stage }) => {
    const cfg = STAGE_CONFIG[stage] ?? { color: isDark ? '#999' : '#64748B', bg: isDark ? '#222' : '#F1F5F9', icon: 'ellipse-outline' };
    return (
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: cfg.bg, paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 6, alignSelf: 'flex-start',
      }}>
        <Ionicons name={cfg.icon} size={13} color={cfg.color} />
        <Text style={{ fontSize: 13, fontWeight: '600', color: cfg.color }}>{stage}</Text>
      </View>
    );
  };

  const DetailRow = ({ label, value, isPremium: fieldIsPremium }) => (
    <View style={{ marginBottom: 16 }}>
      <FieldLabel>{label}</FieldLabel>
      <View>
        {isAlreadyUnlocked || !fieldIsPremium ? (
          <Text style={{ fontSize: 14.5, color: value ? colors.text : colors.secondaryText, lineHeight: 22 }}>
            {value || '—'}
          </Text>
        ) : (
          <PremiumBadge />
        )}
      </View>
    </View>
  );

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <View style={{
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: colors.primary + '15',
          justifyContent: 'center', alignItems: 'center',
          marginBottom: 24
        }}>
          <Ionicons name="lock-closed" size={40} color={colors.primary} />
        </View>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '900', textAlign: 'center' }}>
          Yêu cầu đăng nhập
        </Text>
        <Text style={{ color: colors.secondaryText, fontSize: 15, marginTop: 12, textAlign: 'center', lineHeight: 22 }}>
          Vui lòng đăng nhập hoặc đăng ký tài khoản Startup để xem chi tiết dự án và tài liệu đi kèm.
        </Text>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          style={{
            marginTop: 32, backgroundColor: colors.primary,
            width: '100%', height: 54, borderRadius: 16,
            justifyContent: 'center', alignItems: 'center',
            shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Đăng nhập ngay</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 20 }}
        >
          <Text style={{ color: colors.secondaryText, fontWeight: '600' }}>Quay lại khám phá</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ backgroundColor: colors.background }} edges={['top']} />
      
      {/* HEADER */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.background,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border + '30'
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
          <View>
            <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text }} numberOfLines={1}>
              {project?.name}
            </Text>
            <Text style={{ fontSize: 13, color: colors.secondaryText }}>Chi tiết dự án</Text>
          </View>
        </TouchableOpacity>

        {project?.status === 'approved' && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 5,
            backgroundColor: 'rgba(39,174,96,0.15)',
            borderWidth: 1, borderColor: '#27AE60',
            paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
          }}>
            <Ionicons name="checkmark-circle" size={14} color="#27AE60" />
            <Text style={{ fontSize: 13, color: '#27AE60', fontWeight: '800' }}>
              Đã duyệt
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO SECTION */}
        <LinearGradient
          colors={isDark 
            ? [colors.primary + '30', colors.background] 
            : [colors.primary + '10', colors.background]
          }
          style={{ paddingHorizontal: 20, paddingTop: 32, paddingBottom: 40 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
            <View style={{
              width: 84, height: 84, borderRadius: 24,
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
              justifyContent: 'center', alignItems: 'center',
              borderWidth: 1, borderColor: colors.border + '50',
              ...Platform.select({
                ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16 },
                android: { elevation: 6 }
              })
            }}>
              {project.startupLogoUrl ? (
                <Image source={{ uri: project.startupLogoUrl }} style={{ width: '100%', height: '100%', borderRadius: 24 }} />
              ) : (
                <View style={{
                  width: '100%', height: '100%', borderRadius: 24,
                  backgroundColor: getAvatarColor(project.startupCompanyName || project.name),
                  justifyContent: 'center', alignItems: 'center'
                }}>
                  <Text style={{ fontSize: 32, fontWeight: '900', color: '#fff' }}>
                    {(project.startupCompanyName || project.name).charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 26, fontWeight: '900', color: colors.text, marginBottom: 4 }}>
                {project.name}
              </Text>
              <Text style={{ fontSize: 14, color: colors.secondaryText, fontWeight: '500' }}>
                {project.startupCompanyName || 'Công ty khởi nghiệp'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={{ gap: 12, marginHorizontal: 16, marginBottom: 28 }}>
          {[
            {
              icon: <Ionicons name="logo-usd" size={18} color={colors.primary} />,
              label: 'DOANH THU',
              isPremium: true,
              value: formatCurrency(project.revenue),
              color: colors.primary
            },
            {
              icon: <Ionicons name="bar-chart-outline" size={18} color="#27AE60" />,
              label: 'THỊ TRƯỜNG',
              isPremium: true,
              value: formatCurrency(project.marketSize),
              color: '#27AE60'
            },
            {
              icon: <Ionicons name="flash" size={18} color="#F5A623" />,
              label: 'ĐIỂM AI',
              isPremium: false,
              value: project.startupPotentialScore || project.aiScore || '—',
              color: '#F5A623'
            },
          ].map((stat, index) => (
            <View key={index} style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fff',
              paddingHorizontal: 16, paddingVertical: 16, borderRadius: 20,
              borderWidth: 1, borderColor: colors.border + '40',
              ...Platform.select({
                ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
                android: { elevation: 2 }
              })
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
                <View style={{ 
                  width: 38, height: 38, borderRadius: 12, 
                  backgroundColor: stat.color + '15', 
                  justifyContent: 'center', alignItems: 'center' 
                }}>
                  {stat.icon}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: colors.secondaryText, letterSpacing: 1, marginBottom: 4 }}>
                    {stat.label}
                  </Text>
                  {isOwner || isAlreadyUnlocked || !stat.isPremium ? (
                    <Text style={{ fontSize: 18, fontWeight: '900', color: stat.color }} numberOfLines={1}>
                      {stat.value}
                    </Text>
                  ) : (
                    <View style={{ width: 100 }}>
                      <PremiumBadge onPress={() => setShowUnlockModal(true)} />
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* THÔNG TIN CƠ BẢN */}
        <SectionCard
          icon={<Ionicons name="clipboard-outline" size={16} color={colors.primary} />}
          title="THÔNG TIN CƠ BẢN"
          accentColor={colors.primary}
        >
          <FieldLabel>MÔ TẢ NGẮN</FieldLabel>
          <Text style={{ fontSize: 13.5, color: colors.text, lineHeight: 20, marginBottom: 14 }}>{project.shortDescription || project.description}</Text>

          <FieldLabel>GIAI ĐOẠN PHÁT TRIỂN</FieldLabel>
          <StageBadge stage={project.stage} />

          <DetailRow label="VẤN ĐỀ CẦN GIẢI QUYẾT" value={project.problemStatement} />
          <DetailRow label="GIẢI PHÁP ĐỀ XUẤT" value={project.solutionDescription || project.proposedSolution} />
        </SectionCard>

        {/* HÌNH ẢNH DỰ ÁN */}
        <SectionCard
          icon={<Ionicons name="image-outline" size={16} color={colors.primary} />}
          title="HÌNH ẢNH DỰ ÁN"
          accentColor={colors.primary}
        >
          {project.projectImageUrl ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                // Potential fullscreen view logic
              }}
              style={{ borderRadius: 12, overflow: 'hidden', height: 180, width: '100%', backgroundColor: colors.mutedBackground }}
            >
              <Image
                source={{ uri: project.projectImageUrl }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            <View style={{ height: 120, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mutedBackground, borderRadius: 12 }}>
              <Ionicons name="image-outline" size={32} color={colors.border} />
              <Text style={{ color: colors.secondaryText, fontSize: 13, marginTop: 8 }}>Không có hình ảnh mô tả</Text>
            </View>
          )}
        </SectionCard>

        {/* ĐỘI NGŨ */}
        <SectionCard
          icon={<Ionicons name="people-outline" size={16} color="#A78BFA" />}
          title="ĐỘI NGŨ"
          accentColor="#A78BFA"
        >
          <DetailRow label="THÀNH VIÊN" value={project.teamMembers} isPremium />
          <DetailRow label="KỸ NĂNG CỐT LÕI" value={project.keySkills} />
        </SectionCard>

        {/* ACTION BUTTONS: Unlock (for Investor/Startup users) */}
        {isEligible && !isOwner && !isAlreadyUnlocked && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16, gap: 10 }}>
            {/* Unlock Button */}
            {!isAlreadyUnlocked && (
              <TouchableOpacity
                onPress={() => {
                  if (!isPremium) {
                    Alert.alert(
                      'Tính năng Premium',
                      'Bạn cần nâng cấp gói dịch vụ để mở khóa thông tin chi tiết của dự án.',
                      [
                        { text: 'Hủy', style: 'cancel' },
                        { text: 'Nâng cấp ngay', onPress: () => router.push('/subscription/management') }
                      ]
                    );
                    return;
                  }
                  setShowUnlockModal(true);
                }}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                  backgroundColor: isPremium ? colors.primary : '#f59e0b',
                  paddingVertical: 13, borderRadius: 14,
                }}
              >
                <Lock size={16} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
                  {isPremium
                    ? `Mở khóa chi tiết (còn ${quota.remainingProjectViews} lượt)`
                    : 'Nâng cấp để mở khóa'}
                </Text>
              </TouchableOpacity>
            )}

          </View>
        )}

        {/* LỊCH SỬ ĐÁNH GIÁ AI */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.mutedBackground || (isDark ? '#111827' : '#F8FAFC'),
          borderRadius: 12,
          padding: 16,
          marginHorizontal: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ionicons name="flash-outline" size={22} color="#F5A623" />
            <View>
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>
                Lịch sử đánh giá AI
              </Text>
              <Text style={{ fontSize: 13, color: colors.secondaryText, marginTop: 2 }}>
                {aiHistory?.length > 0
                  ? `Lần cuối: ${formatDate(aiHistory[0].evaluatedAt || aiHistory[0].createdAt)}`
                  : 'Chưa có bản đánh giá nào'}
              </Text>
            </View>
          </View>
          {aiHistory?.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setAiResult(aiHistory[0]);
                setShowAIResultModal(true);
              }}
              style={{ backgroundColor: colors.primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
            >
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>Chi tiết</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* CỐ VẤN CHÍNH THỨC */}
        <SectionCard
          icon={<Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />}
          title="CỐ VẤN CHÍNH THỨC"
          accentColor={colors.primary}
          hasBorderAccent={!!(project.assignedAdvisorName || project.advisors?.length > 0)}
        >
          {project.assignedAdvisorName ? (
            <TouchableOpacity
              onPress={() => router.push(`/advisor/${project.assignedAdvisorId}`)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 8,
              }}
            >
              <View style={{
                width: 44, height: 44, borderRadius: 10,
                backgroundColor: getAvatarColor(project.assignedAdvisorName),
                justifyContent: 'center', alignItems: 'center',
              }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff' }}>
                  {project.assignedAdvisorName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                  {project.assignedAdvisorName}
                </Text>
                <Text style={{ fontSize: 12, color: colors.secondaryText }}>
                  Cố vấn chính thức · {formatCurrency(project.assignedAdvisorHourlyRate)} VND/h
                </Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                  {(project.assignedAdvisorIndustries || []).map((ind) => (
                    <View key={ind} style={{
                      backgroundColor: colors.primary + '15',
                      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
                    }}>
                      <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>{ind}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.border} />
            </TouchableOpacity>
          ) : (
            <Text style={{ color: colors.secondaryText, fontSize: 13 }}>Chưa có cố vấn được chỉ định</Text>
          )}
        </SectionCard>

        {/* THỊ TRƯỜNG & MÔ HÌNH */}
        <SectionCard
          icon={<Ionicons name="trending-up-outline" size={16} color="#27AE60" />}
          title="THỊ TRƯỜNG & MÔ HÌNH"
          accentColor="#27AE60"
        >

          <DetailRow 
            label="MÔ HÌNH KINH DOANH" 
            value={project.businessModel} 
            isPremium 
          />
        </SectionCard>

        {/* CẠNH TRANH */}
        <SectionCard
          icon={<MaterialCommunityIcons name="sword-cross" size={16} color="#E05252" />}
          title="CẠNH TRANH"
          accentColor="#E05252"
        >
          <DetailRow label="KINH NGHIỆM ĐỘI NGŨ" value={project.teamExperience} isPremium />
          <DetailRow label="ĐỐI THỦ CẠNH TRANH" value={project.competitors} isPremium />
        </SectionCard>

        {/* TÀI LIỆU DỰ ÁN */}
        <SectionCard
          icon={<Ionicons name="folder-outline" size={16} color="#F5A623" />}
          title="TÀI LIỆU DỰ ÁN"
          accentColor="#F5A623"
        >
          {documents?.length > 0 ? (
            documents.map((doc) => (
              <TouchableOpacity
                key={doc.documentId || doc.id}
                onPress={() => handleOpenDocument(doc.fileUrl || doc.url)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 10,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.border,
                }}
              >
                <Ionicons name="document-outline" size={22} color={colors.secondaryText} />
                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={{ fontSize: 14, color: colors.text, fontWeight: '700' }}
                  >
                    {doc.fileName || doc.name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: colors.secondaryText }}>{doc.documentType || doc.type}</Text>
                    <Text style={{ fontSize: 12, color: colors.border }}>·</Text>
                    <Text style={{ fontSize: 12, color: colors.secondaryText }}>{formatDate(doc.verifiedAt || doc.createdAt)}</Text>
                  </View>
                </View>
                <Ionicons name="arrow-up-right-box-outline" size={18} color={colors.border} />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={{ color: colors.secondaryText, fontSize: 13 }}>Chưa có tài liệu</Text>
          )}
        </SectionCard>
      </ScrollView>

      {/* Quota Guard Modals */}
      <QuotaGuardModal
        visible={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        onConfirm={handleUnlockProject}
        type="unlock"
        projectName={project?.name}
        isProcessing={isUnlocking}
        isLoadingQuota={false}
        remaining={quota.remainingProjectViews}
        packageName={quota.packageName}
      />
      <QuotaGuardModal
        visible={showAIModal}
        onClose={() => setShowAIModal(false)}
        onConfirm={handleAIAnalyze}
        type="ai"
        projectName={project?.name}
        isProcessing={isAnalyzingAI}
        isLoadingQuota={false}
        remaining={quota.remainingAiRequests}
        packageName={quota.packageName}
      />

      <AIEvaluationModal
        visible={showAIResultModal}
        onClose={() => setShowAIResultModal(false)}
        data={aiResult}
        projectName={project?.name}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
