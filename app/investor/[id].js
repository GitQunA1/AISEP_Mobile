import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Image, ActivityIndicator, Alert, Dimensions, Animated, 
  Platform, Linking 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ArrowLeft, MapPin, CheckCircle, DollarSign, 
  TrendingUp, Globe, Building2, Calendar, Target, 
  Briefcase, Wallet, ShieldCheck, Share2 
} from 'lucide-react-native';

import investorService from '../../src/services/investorService';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DISPLAY = (val, fallback = 'Đang cập nhật') => val && String(val).trim() ? val : fallback;

export default function InvestorDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  
  const [investor, setInvestor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'portfolio'

  // Animations
  const tabUnderlineAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoading && !error && investor) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading, error, investor]);

  useEffect(() => {
    const fetchInvestorDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await investorService.getInvestorById(id);
        if (data) {
          setInvestor(data);
        } else {
          setError('Không tìm thấy thông tin nhà đầu tư.');
        }
      } catch (err) {
        console.error('Investor fetch error:', err);
        setError('Lỗi khi tải thông tin nhà đầu tư.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchInvestorDetails();
  }, [id]);

  useEffect(() => {
    const index = activeTab === 'overview' ? 0 : 1;
    Animated.spring(tabUnderlineAnim, {
      toValue: index * (SCREEN_WIDTH / 2), // 2 tabs instead of 3
      useNativeDriver: true,
      tension: 50,
      friction: 10
    }).start();
  }, [activeTab]);

  const handlePitchClick = () => {
    if (!user) {
      Alert.alert('Chưa đăng nhập', 'Bạn cần đăng nhập để thực hiện hành động này.');
      return;
    }
    if (user.role !== 'startup') {
      Alert.alert('Chỉ tài khoản Startup mới có thể gửi yêu cầu kết nối cho nhà đầu tư.');
      return;
    }
    Alert.alert('Thông báo', `Yêu cầu kết nối đã được gửi tới ${investor?.userName || 'nhà đầu tư'}! (Tính năng đang phát triển)`);
  };

  const formatJoinDate = (dateString) => {
    if (!dateString) return 'Tháng 1 2024'; 
    const d = new Date(dateString);
    return `Tháng ${d.getMonth() + 1} ${d.getFullYear()}`;
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Đang tải thông tin...</Text>
      </View>
    );
  }

  if (error || !investor) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity style={[styles.backBtnLarge, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
          <Text style={styles.backBtnTextLarge}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const name = investor.organizationName || investor.userName;
  const initial = (name || 'I').charAt(0).toUpperCase();
  const handle = investor.email ? `@${investor.email.split('@')[0]}` : `@${(name || 'investor').toLowerCase().replace(/\s+/g, '')}`;
  const isVerified = true; 
  const industries = investor.focusIndustry ? investor.focusIndustry.split(',').map(s => s.trim()) : [];
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        
        {/* STICKY HEADER */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={20}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{name}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.secondaryText }]}>Nhà đầu tư</Text>
          </View>
          <TouchableOpacity onPress={() => Alert.alert('Chia sẻ', 'Tính năng đang phát triển.')} style={styles.headerBtn} hitSlop={20}>
            <Share2 size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[3]}>
          
          {/* BANNER SECTION */}
          <View style={[styles.banner, { backgroundColor: colors.profileGradient[0] }]}>
            <View style={[styles.bannerOverlay, { backgroundColor: colors.profileGradient[1], opacity: 0.3 }]} />
            <View style={styles.bannerPattern}>
                <View style={[styles.stripe, { opacity: 0.1 }]} />
                <View style={[styles.stripe, { opacity: 0.05, top: 40, left: -20 }]} />
            </View>
          </View>

          {/* PROFILE INFO SECTION */}
          <View style={styles.profileSection}>
            <View style={[styles.avatarContainer, { marginTop: -44 }]}>
              <View style={[styles.avatar, { 
                borderColor: activeTheme.isDark ? colors.background : colors.white,
                backgroundColor: colors.primary
              }]}>
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              </View>
            </View>

            <View style={styles.infoContent}>
              <View style={styles.nameRow}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                      <Text style={[styles.name, { color: colors.text, flexShrink: 1 }]} numberOfLines={2}>{name}</Text>
                      {isVerified && (
                          <View style={[styles.verifiedChip, { backgroundColor: colors.primary + '22' }]}>
                              <CheckCircle size={14} color={colors.primary} />
                              <Text style={[styles.verifiedText, { color: colors.primary }]}>Đã xác minh</Text>
                          </View>
                      )}
                  </View>
                  <Text style={[styles.handle, { color: colors.secondaryText }]}>{handle}</Text>
                </View>
              </View>

              <View style={styles.bioContainer}>
                <Text style={[styles.bio, { color: colors.text }]}>{investor.investmentTaste || 'Thông tin giới thiệu về nhà đầu tư...'}</Text>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <MapPin size={13} color={colors.secondaryText} />
                  <Text style={[styles.metaText, { color: colors.secondaryText }]}>{investor.investmentRegion || 'Khu vực Đông Nam Á'}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Calendar size={13} color={colors.secondaryText} />
                  <Text style={[styles.metaText, { color: colors.secondaryText }]}>Tham gia {formatJoinDate(investor.investmentDate)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* STATS STRIP */}
          <View style={[styles.statsCard, { 
              backgroundColor: colors.card,
              borderColor: colors.border,
              ...activeTheme.shadows.sm
          }]}>
            {investor.previousInvestments && (
              <>
                <View style={styles.statBox}>
                    <Text style={[styles.statNum, { color: colors.text }]}>{investor.previousInvestments.split(',').length}</Text>
                    <Text style={[styles.statLab, { color: colors.secondaryText }]}>Khoản đầu tư</Text>
                </View>
                <View style={[styles.vDivider, { backgroundColor: colors.border }]} />
              </>
            )}
            <View style={styles.statBox}>
                <Text style={[styles.statNum, { color: colors.primary, fontSize: 18 }]} numberOfLines={1} adjustsFontSizeToFit>
                  {investor.investmentAmount?.toLocaleString() || '0'} đ
                </Text>
                <Text style={[styles.statLab, { color: colors.secondaryText }]}>Đã triển khai</Text>
            </View>
          </View>

          {/* TABS HEADER */}
          <View style={{ backgroundColor: colors.background }}>
            <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
                <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('overview')}>
                    <Text style={[styles.tabLabel, { color: activeTab === 'overview' ? colors.primary : colors.secondaryText }]}>Tổng quan</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('portfolio')}>
                    <Text style={[styles.tabLabel, { color: activeTab === 'portfolio' ? colors.primary : colors.secondaryText }]}>Danh mục đầu tư</Text>
                </TouchableOpacity>
                <Animated.View style={[
                  styles.tabUnderline, 
                  { backgroundColor: colors.primary, width: SCREEN_WIDTH / 2, transform: [{ translateX: tabUnderlineAnim }] }]} 
                />
            </View>
          </View>

          {/* TAB CONTENT */}
          <View style={styles.tabContainer}>
            {activeTab === 'overview' && (
              <View style={styles.tabPane}>
                <View style={[styles.contentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Triết lý đầu tư</Text>
                  <Text style={[styles.cardDesc, { color: colors.text }]}>
                    {investor.investmentTaste || 'Chưa cập nhật chi tiết triết lý và chiến lược đầu tư.'}
                  </Text>
                </View>

                {/* 2X2 GRID */}
                <View style={styles.grid}>
                  <View style={[styles.gridItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Target size={24} color={colors.primary} />
                    <Text style={[styles.gridLabel, { color: colors.secondaryText }]}>Ngành trọng điểm</Text>
                    <Text style={[styles.gridValue, { color: colors.text }]}>{investor.focusIndustry || 'Đa ngành'}</Text>
                  </View>
                  <View style={[styles.gridItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TrendingUp size={24} color={colors.warning} />
                    <Text style={[styles.gridLabel, { color: colors.secondaryText }]}>Giai đoạn ưu tiên</Text>
                    <Text style={[styles.gridValue, { color: colors.text }]}>Giai đoạn {investor.preferredStage || 'Sớm'}</Text>
                  </View>
                  <View style={[styles.gridItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Wallet size={24} color={colors.primary} />
                    <Text style={[styles.gridLabel, { color: colors.secondaryText }]}>Kích cỡ vé đầu tư</Text>
                    <Text style={[styles.gridValue, { color: colors.text }]}>{investor.investmentAmount ? `${investor.investmentAmount.toLocaleString()} đ` : 'N/A'}</Text>
                  </View>
                  <View style={[styles.gridItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Briefcase size={24} color={colors.primary} />
                    <Text style={[styles.gridLabel, { color: colors.secondaryText }]}>Khả năng rủi ro</Text>
                    <Text style={[styles.gridValue, { color: colors.text }]}>Mức {investor.riskTolerance || 'N/A'}</Text>
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'portfolio' && (
              <View style={styles.tabPane}>
                <View style={[styles.contentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Các khoản đầu tư trước đây</Text>
                  <Text style={[styles.cardDesc, { color: colors.text }]}>
                    {investor.previousInvestments || 'Chưa cập nhật thông tin các khoản đầu tư.'}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </Animated.View>

      {/* PINNED BOTTOM CTA */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.mainConnectBtn, { backgroundColor: colors.primary }]}
          onPress={handlePitchClick}
          activeOpacity={0.8}
        >
          <ShieldCheck size={20} color="#fff" style={{marginRight: 8}} />
          <Text style={styles.mainConnectText}>Gửi yêu cầu hợp tác</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 15, fontWeight: '500' },
  errorText: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
  backBtnLarge: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backBtnTextLarge: { color: '#fff', fontSize: 16, fontWeight: '700' },

  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
  },

  banner: {
    height: 140,
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerPattern: {
    ...StyleSheet.absoluteFillObject,
  },
  stripe: {
    position: 'absolute',
    width: '150%',
    height: 60,
    backgroundColor: '#fff',
    transform: [{ rotate: '-15deg' }],
    top: -20,
    left: -20,
  },

  profileSection: {
    paddingHorizontal: 20,
  },
  avatarContainer: {
    width: 94,
    height: 94,
    position: 'relative',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      }
    })
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },

  infoContent: {
    marginTop: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '700',
  },
  handle: {
    fontSize: 15,
    marginTop: 4,
  },
  bioContainer: {
    marginTop: 16,
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
  },

  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
  },

  statsCard: {
    flexDirection: 'row',
    borderRadius: 16,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  statNum: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLab: {
    fontSize: 12,
    marginTop: 2,
  },
  vDivider: {
    width: 1,
    height: '60%',
  },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    position: 'relative',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    height: 2,
    borderRadius: 1,
  },

  tabContainer: {
    paddingTop: 24,
  },
  tabPane: {
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  gridItem: {
    width: (SCREEN_WIDTH - 52) / 2,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  gridLabel: {
    fontSize: 13,
    marginTop: 8,
    fontWeight: '500',
  },
  gridValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },

  contentCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  cardDesc: {
    fontSize: 15,
    lineHeight: 24,
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    ...Platform.select({
      ios: { paddingBottom: 34 },
    })
  },
  mainConnectBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainConnectText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
