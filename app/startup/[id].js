import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking, Dimensions, Image } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ExpoLinking from 'expo-linking';

import projectSubmissionService from '../../src/services/projectSubmissionService';
import startupProfileService from '../../src/services/startupProfileService';
import AIEvaluationService from '../../src/services/AIEvaluationService';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function StartupDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { activeTheme, isDark } = useTheme();
  const colors = activeTheme.colors;
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [aiHistory, setAiHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
      const isInvestorOrPremium = user && (user.role === 'investor' || user.role === 'Investor' || String(user.role) === '1');
      const fetchMethod = isInvestorOrPremium 
          ? projectSubmissionService.getProjectById(id)
          : projectSubmissionService.getProjectNonPremiumById(id);
          
      const [pRes, dRes, aRes] = await Promise.all([
          fetchMethod,
          projectSubmissionService.getDocuments(id).catch(() => null),
          AIEvaluationService.getProjectAnalysisHistory(id).catch(() => null)
      ]);

      if (pRes?.success && pRes?.data) {
        const d = pRes.data;
        
        // Ownership check
        if (user && (user.role === 'startup' || user.role === 'Startup' || String(user.role) === '2')) {
          try {
            const meRes = await startupProfileService.getStartupProfileByUserId(user.userId);
            if (meRes && d.startupId === meRes.id) {
              setIsOwner(true);
              // If owner, fetch full details if not already fetched
              if (!isInvestorOrPremium) {
                const fullRes = await projectSubmissionService.getProjectById(id);
                if (fullRes?.success && fullRes.data) {
                  setProject({
                    ...fullRes.data,
                    name: fullRes.data.projectName || 'Dự án',
                    stage: fullRes.data.developmentStage || 'Ý tưởng',
                    status: fullRes.data.status || 'Pending',
                    tags: fullRes.data.keySkills ? fullRes.data.keySkills.split(',').map(s => s.trim()).filter(Boolean) : [],
                  });
                  return;
                }
              }
            }
          } catch (e) {
            console.log('Error checking ownership:', e);
          }
        }

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
  }, [id, user]);

  useEffect(() => {
    loadProjectDetail();
  }, [loadProjectDetail]);

  const handleOpenDocument = (url) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {
      Alert.alert('Lỗi', 'Không thể mở tài liệu này');
    });
  };

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

  const AVATAR_PALETTE = ['#E05252','#E07D52','#7B52E0','#52C07B','#C05290','#4A90D9','#D4A017'];
  const getAvatarColor = (name) => {
    const hash = [...(name || '')].reduce((a, c) => a + c.charCodeAt(0), 0);
    return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
  };

  const formatCurrency = (n) => n?.toLocaleString('vi-VN') ?? '0';
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

  const PremiumLock = () => (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: isDark ? '#3D2B00' : '#FFF9E6',
      paddingHorizontal: 10, paddingVertical: 6,
      borderRadius: 6, alignSelf: 'flex-start',
      borderWidth: isDark ? 0 : 1,
      borderColor: isDark ? 'transparent' : '#FEF3C7',
    }}>
      <Ionicons name="lock-closed" size={13} color={isDark ? '#F5A623' : '#B45309'} />
      <Text style={{ fontSize: 12, color: isDark ? '#F5A623' : '#B45309', fontWeight: '800' }}>PREMIUM</Text>
    </View>
  );

  const Divider = () => (
    <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 12 }} />
  );

  const SectionCard = ({ icon, title, accentColor, hasBorderAccent, children }) => (
    <View style={{
      backgroundColor: colors.mutedBackground || (isDark ? '#111827' : '#F8FAFC'),
      borderRadius: 12,
      marginHorizontal: 16,
      marginBottom: 12,
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
    Idea:   { color: '#F5A623', bg: isDark ? '#3D2B00' : '#FFF9E6', icon: 'bulb-outline' },
    MVP:    { color: '#2D7EFF', bg: isDark ? '#002B4D' : '#EBF5FF', icon: 'rocket-outline' },
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

  const TwoColumnRow = ({ left, right }) => (
    <View style={{ flexDirection: 'row', gap: 16, marginBottom: 12 }}>
      {[left, right].map((col, i) => (
        <View key={i} style={{ flex: 1 }}>
          <FieldLabel>{col.label}</FieldLabel>
            <Text style={{ fontSize: 13.5, color: col.value ? colors.text : colors.secondaryText, lineHeight: 19 }}>
              {isOwner ? (col.value || '—') : (col.isPremium ? <PremiumLock /> : (col.value || '—'))}
            </Text>
        </View>
      ))}
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
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
      {/* HEADER */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8, // Fixed small padding now that we are inside SafeAreaView
        paddingBottom: 12,
        backgroundColor: colors.background,
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
          colors={isDark ? ['#0D3D3D', '#0a1628', colors.background] : ['#E6FFFA', '#F0F9FF', colors.background]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{
              width: 72, height: 72, borderRadius: 36,
              backgroundColor: getAvatarColor(project.startupCompanyName || project.name),
              justifyContent: 'center', alignItems: 'center',
              shadowColor: getAvatarColor(project.startupCompanyName || project.name),
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.6 : 0.25,
              shadowRadius: 12,
              elevation: 8,
            }}>
              {project.startupLogoUrl ? (
                <Image source={{ uri: project.startupLogoUrl }} style={{ width: '100%', height: '100%', borderRadius: 36 }} />
              ) : (
                <Text style={{ fontSize: 28, fontWeight: '900', color: '#fff' }}>
                  {(project.startupCompanyName || project.name).charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: colors.text, flex: 1 }}>
              {project.name}
            </Text>
          </View>
        </LinearGradient>

        {/* STATS ROW */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: colors.mutedBackground || (isDark ? '#111827' : '#F8FAFC'),
          borderRadius: 12,
          marginHorizontal: 16,
          marginBottom: 16,
          overflow: 'hidden',
          marginTop: -10,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          {[
            {
              icon: <Ionicons name="logo-usd" size={22} color={colors.primary} />,
              label: 'DOANH THU',
              isPremium: project.revenue === undefined,
              value: project.revenue ? formatCurrency(project.revenue) : null,
            },
            {
              icon: <Ionicons name="bar-chart-outline" size={22} color="#27AE60" />,
              label: 'THỊ TRƯỜNG',
              isPremium: project.marketSize === undefined,
              value: project.marketSize ? formatCurrency(project.marketSize) : null,
            },
            {
              icon: <Ionicons name="flash" size={22} color="#F5A623" />,
              label: 'ĐIỂM AI',
              isPremium: false,
              value: project.startupPotentialScore || project.aiScore,
              emptyText: 'Chưa có',
            },
          ].map((stat, index, arr) => (
            <React.Fragment key={stat.label}>
              <View style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 20,
                paddingHorizontal: 8,
              }}>
                {stat.icon}
                <View style={{ marginTop: 8, alignItems: 'center' }}>
                  {isOwner ? (
                    <Text style={{ fontSize: 18, fontWeight: '800', color: index === 2 ? '#F5A623' : colors.text, marginBottom: 4 }}>
                      {stat.value || '—'}
                    </Text>
                  ) : stat.isPremium ? (
                      <View style={{
                        flexDirection: 'row', alignItems: 'center', gap: 4,
                        backgroundColor: isDark ? '#3D2B00' : '#FFF9E6',
                        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
                        marginBottom: 6,
                        borderWidth: isDark ? 0 : 1,
                        borderColor: isDark ? 'transparent' : '#FEF3C7',
                      }}>
                        <Ionicons name="lock-closed" size={11} color={isDark ? '#F5A623' : '#B45309'} />
                        <Text style={{ fontSize: 11, color: isDark ? '#F5A623' : '#B45309', fontWeight: '700' }}>
                          Premium
                        </Text>
                      </View>
                  ) : stat.value != null ? (
                    <Text style={{ fontSize: 18, fontWeight: '800', color: index === 2 ? '#F5A623' : colors.text, marginBottom: 4 }}>
                      {stat.value}
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 13, color: colors.secondaryText, marginBottom: 6 }}>
                      {stat.emptyText}
                    </Text>
                  )}
                  <Text style={{ fontSize: 10, fontWeight: '800', color: colors.secondaryText, letterSpacing: 1 }}>
                    {stat.label}
                  </Text>
                </View>
              </View>
              {index < arr.length - 1 && (
                <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 16 }} />
              )}
            </React.Fragment>
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

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
            <View style={{ flex: 1 }}>
              <FieldLabel>VẤN ĐỀ CẦN GIẢI QUYẾT</FieldLabel>
              <Text style={{ fontSize: 13.5, color: colors.text, lineHeight: 19 }}>{project.problemStatement || '—'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <FieldLabel>GIẢI PHÁP ĐỀ XUẤT</FieldLabel>
              <Text style={{ fontSize: 13.5, color: colors.text, lineHeight: 19 }}>{project.solutionDescription || project.proposedSolution || '—'}</Text>
            </View>
          </View>
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
          {isOwner ? (
             <Text style={{ fontSize: 13.5, color: colors.text, lineHeight: 19 }}>{project.teamMembers || '—'}</Text>
          ) : project.teamMembers ? (
             <Text style={{ fontSize: 13.5, color: colors.text, lineHeight: 19 }}>{project.teamMembers}</Text>
          ) : (
            <PremiumLock />
          )}
          <Divider />
          <FieldLabel>KỸ NĂNG CỐT LÕI</FieldLabel>
          {isOwner ? (
             <Text style={{ fontSize: 13.5, color: colors.text, lineHeight: 19 }}>{project.keySkills || '—'}</Text>
          ) : project.keySkills ? (
             <Text style={{ fontSize: 13.5, color: colors.text, lineHeight: 19 }}>{project.keySkills}</Text>
          ) : (
            <PremiumLock />
          )}
        </SectionCard>

        {/* LỊCH SỬ ĐÁNH GIÁ AI */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          backgroundColor: colors.mutedBackground || (isDark ? '#111827' : '#F8FAFC'),
          borderRadius: 12,
          padding: 16,
          marginHorizontal: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          <Ionicons name="flash-outline" size={22} color="#F5A623" />
          <View>
            <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>
              Lịch sử đánh giá AI
            </Text>
            <Text style={{ fontSize: 13, color: colors.secondaryText, marginTop: 2 }}>
              {aiHistory?.length > 0
                ? `${aiHistory.length} lần đánh giá`
                : 'Chưa có dữ liệu đánh giá'}
            </Text>
          </View>
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
          <TwoColumnRow
            left={{ label: 'KHÁCH HÀNG MỤC TIÊU', value: project.targetCustomers || project.customerSegment }}
            right={{ label: 'GIÁ TRỊ ĐỘC ĐÁO (UVP)', value: project.uniqueValueProposition || project.valueProposition }}
          />

          <TwoColumnRow
            left={{ label: 'QUY MÔ THỊ TRƯỜNG', value: project.marketSize ? formatCurrency(project.marketSize) : null, isPremium: project.marketSize === undefined }}
            right={{ label: 'DOANH THU', value: project.revenue ? formatCurrency(project.revenue) : null, isPremium: project.revenue === undefined }}
          />

          <View style={{ marginTop: 12 }}>
            <FieldLabel>MÔ HÌNH KINH DOANH</FieldLabel>
            {isOwner ? (
               <Text style={{ fontSize: 13.5, color: colors.text, lineHeight: 19 }}>{project.businessModel || '—'}</Text>
            ) : project.businessModel ? (
               <Text style={{ fontSize: 13.5, color: colors.text, lineHeight: 19 }}>{project.businessModel}</Text>
            ) : (
              <PremiumLock />
            )}
          </View>
        </SectionCard>

        {/* CẠNH TRANH */}
        <SectionCard
          icon={<MaterialCommunityIcons name="sword-cross" size={16} color="#E05252" />}
          title="CẠNH TRANH"
          accentColor="#E05252"
        >
          <TwoColumnRow
            left={{ label: 'KINH NGHIỆM ĐỘI NGŨ', value: project.teamExperience, isPremium: project.teamExperience === undefined }}
            right={{ label: 'ĐỐI THỦ CẠNH TRANH', value: project.competitors, isPremium: project.competitors === undefined }}
          />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
